import asyncio
import email
import email.message
import shutil
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

def _deduplicate_name(now_subs: SubscriptionDict, filename: str) -> Optional[str]:
    
    def check_exist(name) -> bool:
        is_exist = False
        for sub_name in now_subs:
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
            return None
    return filename

def download_sub(url: str, now_subs: SubscriptionDict, timeout: Optional[float] = None) -> Tuple[bool, Subscription | str]:
    """
    Download new subscription
    Args:
        url: Subscription url
        now_subs: Currently subscriptions list
        timeout: Download timeout
        disable_verify: Disable SSL verification
    Returns:
        tuple(bool, Subscription | str)
        bool: Whether download success
        Subscription | str: Subscription detail or error message
    """
    logger.info(f"downloading subscription: {url}")
    if not os.path.exists(SUBSCRIPTIONS_DIR):
        os.mkdir(SUBSCRIPTIONS_DIR)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        resp: http.client.HTTPResponse = urllib.request.urlopen(
            req, timeout=timeout, context=utils.get_ssl_context())
    except Exception as e:
        logger.error(f"download_sub: failed with {e}")
        return False, f"Exception: {e}"

    logger.debug(f"download_sub: status code: {resp.status}")
    if resp.status is int and resp.status != 200:
        logger.error(f"body: {resp.read()}")
        return False, f"Invalid status code: {resp.status}"
    
    # get file name
    msg = email.message.Message()
    msg.add_header('content-disposition', resp.headers.get('content-disposition')) # type: ignore
    msg.add_header('content-type', resp.headers.get('content-type')) # type: ignore
    filename = msg.get_filename()

    if filename is None or filename == '':
        url_parts = urllib.parse.urlparse(url)
        paths = url_parts.path.split('/')
        if len(paths) > 0:
            filename = paths[-1]
    if filename is None or filename == '':
        filename = utils.rand_thing()
    if filename.lower().endswith('.yml'):
        filename = filename[:-4]
    if filename.lower().endswith('.yaml'):
        filename = filename[:-5]

    filename = _deduplicate_name(now_subs, filename)
    if filename is None:
        logger.error(f'download_sub: failed to deduplicate name: {filename}')
        return False, 'No available filename'

    filename = utils.sanitize_filename(filename)
    path = get_path(filename)
    logger.info(f'saving to {path}')

    try:
        with open(get_path(filename), 'xb') as out_file:
            out_file.write(resp.read())
    except Exception as e:
        logger.error(f"download_sub: io error: {e}")
        return False, f"IO error: {e}"
    
    valid = core.CoreController.check_config(path)
    if not valid:
        logger.error("download_sub: invalid config")
        try:
            os.remove(get_path(filename))
        except Exception as e:
            logger.error(f"download_sub: error removing file: {e}")
        return False, "Invalid config"
    
    return True, (filename, url)

async def update_sub(name: str, url: str, timeout: float) -> Optional[str]:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        await utils.get_url_to_file(req, get_path(name), timeout)
    except Exception as e:
        logger.error(f"update sub {name} error: {e}")
        return str(e)
    return None

def check_subs(subs: SubscriptionDict) -> List[str]:
    """
    Check subscriptions
    Args:
        subs: Subscriptions list
    Returns:
        list[str]: List of failed subscriptions
    """
    failed = []
    for name in subs:
        if not os.path.exists(get_path(name)):
            failed.append(name)
            logger.info(f"check_subs: {name} not exists")

    return failed

def duplicate_sub(subs: SubscriptionDict, name: str) -> Optional[str]:
    if name not in subs:
        return None
    new_name = _deduplicate_name(subs, name)
    if new_name is None:
        logger.error("duplicate_sub: failed to deduplicate name")
        return None
    try:
        shutil.copyfile(get_path(name), get_path(new_name))
    except Exception as e:
        logger.error(f"duplicate_sub: error {e}")
        return None
    return new_name
