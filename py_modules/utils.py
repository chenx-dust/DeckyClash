import asyncio
import base64
import json
import random
import re
import ssl
import urllib.request
import fcntl
import struct
import socket
from typing import Any, List, Optional

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
        with urllib.request.urlopen(url, timeout=timeout, context=_ssl_context) as response, open(dest, 'wb') as out_file:
            out_file.write(response.read())
    await asyncio.to_thread(_impl)

def rand_thing() -> str:
    return base64.urlsafe_b64encode(random.randbytes(8)).decode()[:-1]

def not_none(x: Optional[Any]) -> Any:
    if x is None:
        raise ValueError('None is not allowed')
    return x

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
