import asyncio
import base64
import json
import random
import ssl
import urllib.request
from typing import Any, Optional


_ssl_context = ssl.create_default_context()

def get_ssl_context() -> ssl.SSLContext:
    return _ssl_context

async def get_url_to_json(url: str | urllib.request.Request) -> Any:
    return (await asyncio.to_thread(
        lambda: json.load(urllib.request.urlopen(url, context=_ssl_context)),
    ))

async def get_url_to_file(url: str | urllib.request.Request, dest: str) -> None:
    def _impl():
        with urllib.request.urlopen(url, context=_ssl_context) as response, open(dest, 'wb') as out_file:
            out_file.write(response.read())
    await asyncio.to_thread(_impl)

def rand_thing() -> str:
    return base64.urlsafe_b64encode(random.randbytes(18)).decode()[:-1]

def not_none(x: Optional[Any]) -> Any:
    if x is None:
        raise ValueError('None is not allowed')
    return x
