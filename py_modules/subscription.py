import asyncio
import email
import email.message
from typing import Dict, List, Optional, Tuple
import os
import urllib.request
import urllib.parse
import http.client

import core
import decky
from decky import logger
import utils

SUBSCRIPTIONS_DIR = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "subscriptions")
USER_AGENT = f"{decky.DECKY_PLUGIN_NAME}/{decky.DECKY_PLUGIN_VERSION} mihomo/1.19.10 clash-verge/2.2.3 Clash/v1.18.0"

SubscriptionDict = Dict[str, str]
Subscription = Tuple[str, str]

def get_path(filename: str) -> str:
    return os.path.join(SUBSCRIPTIONS_DIR, filename + ".yaml")

async def download_sub(url: str, now_subs: SubscriptionDict, timeout: float) -> Tuple[bool, Subscription | str]:
    """
    下载新订阅
    Args:
        url: 订阅链接
    Returns:
        tuple(bool, Subscription | str)
        bool: 是否下载成功
        Subscription | str: 订阅内容 | 错误信息
    """
    logger.info(f"downloading subscription: {url}")
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    # resp: http.client.HTTPResponse = await asyncio.to_thread (
    #     urllib.request.urlopen,
    #     req,
    #     timeout=timeout,
    #     context=utils.get_ssl_context()
    # )
    import ssl
    resp: http.client.HTTPResponse = urllib.request.urlopen(req, timeout=timeout, context=ssl.create_default_context())

    logger.info(f"download_sub: status code: {resp.status}")
    if resp.status != 200:
        logger.error(f"body: {resp.read()}")
        return False, f"Invalid status code: {resp.status}"
    
    # get file name
    msg = email.message.Message()
    msg.add_header('content-disposition', resp.headers.get('content-disposition')) # type: ignore
    msg.add_header('content-type', resp.headers.get('content-type')) # type: ignore
    filename = msg.get_filename()

    if filename is None:
        url_parts = urllib.parse.urlparse(url)
        paths = url_parts.path.split('/')
        if len(paths) > 0:
            filename = paths[-1]
    if filename is None:
        filename = utils.rand_thing()
    if filename.lower().endswith('.yml'):
        filename = filename[:-4]
    if filename.lower().endswith('.yaml'):
        filename = filename[:-5]

    def check_exist(name) -> bool:
        is_exist = False
        for sub_name, _ in now_subs:
            if sub_name == name:
                is_exist = True
                break
        return is_exist
    if check_exist(filename):
        available = False
        for i in range(100):
            if not check_exist(f'{filename}_{i}'):
                filename = f'{filename}_{i}'
                available = True
                break
        if not available:
            logger.error('download_sub: no available filename')
            return False, 'No available filename'
    path = get_path(filename)
    logger.info(f'saving to {path}')

    def _write_to_file(dest: str, response: http.client.HTTPResponse):
        with open(dest, 'wb') as out_file:
            out_file.write(response.read())

    try:
        await asyncio.to_thread(
            _write_to_file,
            get_path(filename),
            resp,
        )
    except Exception as e:
        logger.error(f"download_sub: io error: {e}")
        return False, f"io error: {e}"
    
    valid = await core.CoreController.check_config(path)
    if not valid:
        logger.error("download_sub: invalid config")
        try:
            os.remove(get_path(filename))
        except Exception as e:
            logger.error(f"download_sub: error removing file: {e}")
        return False, "invalid config"
    
    return True, (filename, url)

async def update_subs(subs: SubscriptionDict, timeout: float) -> List[Tuple[str, str]]:
    """
    更新订阅
    Args:
        subs: 订阅列表
    Returns:
        更新失败的订阅名称列表
    """
    logger.info("update_subs: start updating")
    async def _impl(name: str, url: str) -> Optional[str]:
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        try:
            await utils.get_url_to_file(req, get_path(name), timeout)
        except Exception as e:
            logger.error(f"update sub {name} error: {e}")
            return str(e)
        return None

    promises = [
        _impl(name, url)
        for name, url in subs
    ]
    results = await asyncio.gather(*promises)

    failed = []
    for (name, _), result in zip(subs, results):
        if result is not None:
            failed.append((name, result))
    return failed

def check_subs(subs: SubscriptionDict) -> List[str]:
    """
    检查订阅状态
    Args:
        subs: 订阅列表
    Returns:
        检查失败需要删除的订阅列表
    """
    failed = []
    for name, _ in subs:
        if not os.path.exists(get_path(name)):
            failed.append(name)
            logger.info(f"check_subs: {name} not exists")

    return failed
