import asyncio
import base64
import json
import os
import random
import re
import ssl
import urllib.request
import fcntl
import struct
import socket
from typing import Any, Awaitable, Callable, List, Optional

import aiohttp

from decky import logger

_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
SIOCGIFADDR = 0x8915
_sockfd = _sock.fileno()


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
            data = response.read()
        if os.path.exists(dest):
            logger.debug(f"get_url_to_file: removing {dest}")
            os.remove(dest)
        with open(dest, 'wb') as out:
            out.write(data)
    await asyncio.to_thread(_impl)

def rand_thing() -> str:
    return base64.urlsafe_b64encode(random.randbytes(8)).decode()[:-1]

def get_ip_by_iface(iface: str) -> Optional[str]:
    ifreq = struct.pack('16sH14s', iface.encode(), socket.AF_INET, b'\x00'*14)
    try:
        res = fcntl.ioctl(_sockfd, SIOCGIFADDR, ifreq)
    except Exception as e:
        logger.error(f'get_ip_by_iface: failed to get IP address by {iface} with {e}')
        return None
    ip = struct.unpack('16sH2x4s8x', res)[2]
    return socket.inet_ntoa(ip)

def get_ip_by_hostname() -> Optional[List[str]]:
    try:
        return socket.gethostbyname_ex(socket.gethostname())[2]
    except Exception as e:
        logger.error(f'get_ip_by_hostname: failed to get IP address: {e}')
        return None

def get_ip_by_connect(dest: str = "8.8.8.8", port: int = 53) -> Optional[str]:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect((dest, port))
            return s.getsockname()[0]
    except Exception as e:
        logger.error(f'get_ip_by_connect: failed to get IP address: {e}')
        return None

def get_ip() -> str:
    ip = get_ip_by_iface('wlan0')
    if ip is not None:
        return ip
    ip = get_ip_by_iface('eth0')
    if ip is not None:
        return ip
    ips = get_ip_by_hostname()
    if ips is not None:
        for i in ips:
            if not i.startswith('127.') and not i.startswith('172.') and not i.startswith('198.'):
                ip = i
    if ip is not None:
        return ip
    ip = get_ip_by_connect()
    if ip is not None:
        return ip
    return '127.0.0.1'

def sanitize_filename(name: str) -> str:
    return re.sub('[/]', '-', name)

def env_fix() -> dict[str, str]:
    current_env = os.environ.copy()
    current_env.pop('LD_LIBRARY_PATH', None)
    return current_env

ProgressCallback = Callable[[int], Awaitable]
async def download_with_progress(url: str, path: str, progress_callback: ProgressCallback) -> None:
    logger.debug(f"downloading: {url} to {path}")
    downloaded_size = 0
    last_percent = 0
    await progress_callback(0)
    if os.path.exists(path):
        os.remove(path)
    async with aiohttp.ClientSession(
        connector=aiohttp.TCPConnector(ssl=get_ssl_context()),
        timeout=aiohttp.ClientTimeout(0)) as session:
        async with session.get(url) as response:
            total_size = int(response.headers.get("Content-Length", 0))
            logger.debug(f"downloading: {total_size} bytes")
            with open(path, "wb") as f:
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
