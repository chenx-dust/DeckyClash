import asyncio
import gzip
import json
import os
from pathlib import Path
import shutil
import ssl
import stat
import subprocess
from typing import Optional
import urllib.request

import core
import decky
from decky import logger
from metadata import CORE_REPO, PACKAGE_REPO
import utils

def get_github_api_url(repo: str) -> str:
    return f"https://api.github.com/repos/{repo}/releases/latest"

def recursive_chmod(path: str, perms: int) -> None:
    for dirpath, dirnames, filenames in os.walk(path):
        current_perms = os.stat(dirpath).st_mode
        os.chmod(dirpath, current_perms | perms)
        for filename in filenames:
            os.chmod(os.path.join(dirpath, filename), current_perms | perms)


async def upgrade_to_latest(timeout: float, download_timeout: float) -> None:
    logger.info("upgrading to latest version")
    downloaded_filepath = await download_latest_build(timeout, download_timeout)

    if os.path.exists(downloaded_filepath):
        plugin_dir = decky.DECKY_PLUGIN_DIR

        logger.info(f"removing old plugin from {plugin_dir}")
        # add write perms to directory
        await asyncio.to_thread(recursive_chmod, plugin_dir, stat.S_IWUSR)

        # remove old plugin
        await asyncio.to_thread(shutil.rmtree, plugin_dir)

        logger.info(f"extracting ota file to {plugin_dir}")
        await asyncio.to_thread(
            shutil.unpack_archive,
            downloaded_filepath,
            str(Path(plugin_dir).parent),
            format="zip",
        )
        
        os.chmod(core.CoreController.CORE_PATH, 0o755)

        # cleanup downloaded files
        await asyncio.to_thread(os.remove, downloaded_filepath)

        logger.info("restarting plugin_loader.service")
        cmd = "pkill -HUP PluginLoader"
        os.system(cmd)

async def upgrade_to_latest_core(timeout: float, download_timeout) -> None:
    logger.info("upgrading to latest version of core")
    downloaded_filepath = await download_latest_core(timeout, download_timeout)
    core_path = core.CoreController.CORE_PATH

    if os.path.exists(downloaded_filepath):
        logger.info(f"removing old plugin from {core_path}")
        # remove old plugin
        await asyncio.to_thread(os.remove, core_path)

        logger.info(f"extracting ota file to {core_path}")
        def _impl():
            with gzip.open(downloaded_filepath, "rb") as f, open(core.CoreController.CORE_PATH, "wb") as d:
                    d.write(f.read())
            os.chmod(core.CoreController.CORE_PATH, 0o755)
            # cleanup downloaded files
            os.remove(downloaded_filepath)
        await asyncio.to_thread(_impl)


async def download_latest_build(timeout: float, download_timeout: float) -> str:
    json_data = await utils.get_url_to_json(get_github_api_url(PACKAGE_REPO), timeout)

    download_url = json_data.get("assets")[0].get("browser_download_url")

    logger.info(f"downloading from: {download_url}")

    file_path = os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, decky.DECKY_PLUGIN_NAME + ".zip")

    await utils.get_url_to_file(download_url, file_path, download_timeout)

    return file_path


async def download_latest_core(timeout: float, download_timeout: float) -> str:
    json_data = await utils.get_url_to_json(get_github_api_url(CORE_REPO), timeout)

    download_url: Optional[str] = None
    for asset in json_data.get("assets"):
        name: str = asset.get("name")
        if name.startswith("mihomo-linux-amd64-") and name.endswith(".gz"):
            download_url = asset.get("browser_download_url")
            break

    if not download_url:
        logger.error("Failed to find download url")
        return ""
    logger.info(f"downloading from: {download_url}")

    file_path = os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, "mihomo.gz")

    await utils.get_url_to_file(download_url, file_path, download_timeout)

    return file_path


def get_version() -> str:
    return f"{decky.DECKY_PLUGIN_VERSION}"

async def get_latest_version(repo: str, timeout: float) -> str:
    try:
        json_data = await utils.get_url_to_json(get_github_api_url(repo), timeout=timeout)
    except Exception as e:
        logger.error(f"get_latest_version: failed with {e}")
        return ""

    tag = json_data.get("tag_name")
    # if tag is a v* tag, remove the v
    if tag.startswith("v"):
        tag = tag[1:]
    else:
        return ""
    return tag
