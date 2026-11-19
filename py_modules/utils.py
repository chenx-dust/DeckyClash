import asyncio
import base64
import ipaddress
import json
import os
import random
import re
import ssl
import tempfile
import urllib.request
import fcntl
import struct
import socket
from typing import Any, Awaitable, Callable, List, Optional

import aiohttp

from decky import logger

SIOCGIFADDR = 0x8915
_TUN_BENCHMARK_NET = ipaddress.IPv4Network("198.18.0.0/15")
_PREFERRED_IFACE_PREFIXES = ("wlan", "wlp", "eth", "enp", "eno", "ens")
_VIRTUAL_IFACE_PREFIXES = (
    "lo", "tun", "tap", "Meta", "mihomo", "clash", "utun",
    "docker", "veth", "br-", "virbr", "wg", "tailscale", "zt",
)


def init_ssl_context(disable_verify: bool) -> None:
    global _ssl_context
    if disable_verify:
        logger.warning("SSL verification is disabled")
        _ssl_context = ssl._create_unverified_context()
    else:
        _ssl_context = ssl.create_default_context(cafile='/etc/ssl/certs/ca-bundle.crt')

def get_ssl_context() -> ssl.SSLContext:
    return _ssl_context

async def get_url_to_json(url: str | urllib.request.Request, timeout: Optional[float] = None) -> Any:
    return (await asyncio.to_thread(
        lambda: json.load(urllib.request.urlopen(url, context=_ssl_context, timeout=timeout)),
    ))

async def get_url_to_file(url: str | urllib.request.Request, dest: str, timeout: Optional[float] = None) -> None:
    def _impl():
        with urllib.request.urlopen(url, timeout=timeout, context=_ssl_context) as response:
            if response.status is not None and response.status != 200:
                reason = getattr(response, "reason", "")
                raise Exception(f"http error: {response.status} {reason}".strip())
            data = response.read()
        if os.path.exists(dest):
            logger.debug(f"get_url_to_file: removing {dest}")
            os.remove(dest)
        with open(dest, 'wb') as out:
            out.write(data)
    await asyncio.to_thread(_impl)

def rand_thing() -> str:
    return base64.urlsafe_b64encode(random.randbytes(8)).decode()[:-1]

def _is_valid_ip(ip_str: Optional[str]) -> bool:
    """Return True if ip_str is a valid non-loopback, non-virtual LAN IPv4 address."""
    if not ip_str:
        return False
    try:
        addr = ipaddress.IPv4Address(ip_str)
    except ValueError:
        return False
    if addr.is_loopback or addr.is_link_local or addr.is_unspecified or addr.is_multicast:
        return False
    if addr in _TUN_BENCHMARK_NET:
        return False
    return True

def probe_iface() -> List[str]:
    try:
        with open("/proc/net/dev", "r") as f:
            lines = f.readlines()[2:]
        return [line.split(':')[0].strip() for line in lines if ':' in line]
    except Exception as e:
        logger.debug(f'probe_iface: failed to probe interfaces: {e}')
        return []

def get_ip_by_iface(iface: str) -> Optional[str]:
    ifreq = struct.pack('16sH14s', iface.encode()[:15], socket.AF_INET, b'\x00'*14)
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            res = fcntl.ioctl(s.fileno(), SIOCGIFADDR, ifreq)
    except Exception as e:
        logger.debug(f'get_ip_by_iface: failed to get IP address by {iface} with {e}')
        return None
    ip = struct.unpack('16sH2x4s8x', res)[2]
    return socket.inet_ntoa(ip)

def get_ip_by_hostname() -> Optional[List[str]]:
    try:
        return socket.gethostbyname_ex(socket.gethostname())[2]
    except Exception as e:
        logger.debug(f'get_ip_by_hostname: failed to get IP address: {e}')
        return None

def get_ip_by_connect(dest: str = "8.8.8.8", port: int = 53) -> Optional[str]:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect((dest, port))
            return s.getsockname()[0]
    except Exception as e:
        logger.debug(f'get_ip_by_connect: failed to get IP address: {e}')
        return None

def get_ip() -> str:
    ifaces = sorted(probe_iface())

    for prefix in _PREFERRED_IFACE_PREFIXES:
        for iface in ifaces:
            if iface.startswith(prefix):
                ip = get_ip_by_iface(iface)
                if ip is not None and _is_valid_ip(ip):
                    return ip

    for iface in ifaces:
        if iface.startswith(_PREFERRED_IFACE_PREFIXES) or iface.startswith(_VIRTUAL_IFACE_PREFIXES):
            continue
        ip = get_ip_by_iface(iface)
        if ip is not None and _is_valid_ip(ip):
            return ip

    ip = get_ip_by_connect()
    if ip is not None and _is_valid_ip(ip):
        return ip

    ips = get_ip_by_hostname()
    if ips is not None:
        for candidate in ips:
            if _is_valid_ip(candidate):
                return candidate

    return '127.0.0.1'

def sanitize_filename(name: str) -> str:
    return re.sub('[/]', '-', name)

def env_fix() -> dict[str, str]:
    current_env = os.environ.copy()
    current_env.pop('LD_LIBRARY_PATH', None)
    return current_env

def get_traceback(e: BaseException) -> str:
    import traceback
    return '\n'.join(traceback.format_exception(e))

ProgressCallback = Callable[[int], Awaitable]
async def download_with_progress(url: str, name: str, progress_callback: ProgressCallback) -> str:
    with tempfile.NamedTemporaryFile("wb", suffix=name, delete=False) as f:
        logger.debug(f"downloading: {url} to {f.name}")
        downloaded_size = 0
        last_percent = 0
        await progress_callback(0)
        async with aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(ssl=get_ssl_context()),
            timeout=aiohttp.ClientTimeout(0),
            # GitHub's release redirect carries a CSP header larger than the default 8190 bytes
            max_field_size=65536) as session:
            async with session.get(url) as response:
                total_size = int(response.headers.get("Content-Length", 0))
                logger.debug(f"downloading: {total_size} bytes")
                while True:
                    chunk = await response.content.read(128*1024)
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded_size += len(chunk)
                    percent = int(downloaded_size / total_size * 100)
                    if percent > last_percent:
                        last_percent = percent
                        logger.debug(f"downloading: {percent}%")
                        await progress_callback(last_percent)
        await progress_callback(-1)
        return f.name
