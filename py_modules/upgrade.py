import asyncio
import gzip
import json
import os
from pathlib import Path
import shutil
import ssl
import stat
import subprocess
import tempfile
import time
from typing import Dict, Optional, Tuple
import urllib.request

import core
import dashboard
import decky
from decky import logger
from metadata import CORE_REPO, PACKAGE_REPO, YQ_REPO
import utils
import config

def remove_no_fail(path: str):
    try:
        os.remove(path)
    except FileNotFoundError as e:
        logger.warning(f"remove_no_fail: {e}")
    except Exception as e:
        raise e

def get_github_api_url(repo: str) -> str:
    return f"https://api.github.com/repos/{repo}/releases/latest"

def recursive_chmod(path: str, perms: int) -> None:
    for dirpath, dirnames, filenames in os.walk(path):
        current_perms = os.stat(dirpath).st_mode
        os.chmod(dirpath, current_perms | perms)
        for filename in filenames:
            os.chmod(os.path.join(dirpath, filename), current_perms | perms)

async def restart_plugin_loader() -> None:
    proc = await asyncio.create_subprocess_shell(
        "systemctl restart plugin_loader.service",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=utils.env_fix()
    )

    stdout, stderr = await proc.communicate()
    returncode = await proc.wait()
    if stdout is not None and len(stdout) > 0:
        logger.debug(f'plugin_loader output: {stdout.decode()}')
    if stderr is not None and len(stdout) > 0:
        logger.debug(f'plugin_loader output: {stdout.decode()}')
    
    if returncode != 0:
        raise Exception(f'Error restarting plugin_loader with code {returncode}: {stderr.decode()}')

async def upgrade_to_latest(timeout: float, download_timeout: float) -> None:
    logger.info("upgrading to latest version")
    downloaded_filepath = await download_latest_build(timeout, download_timeout)

    if os.path.exists(downloaded_filepath):
        plugin_dir = decky.DECKY_PLUGIN_DIR

        logger.debug(f"removing old plugin from {plugin_dir}")
        # add write perms to directory
        await asyncio.to_thread(recursive_chmod, plugin_dir, stat.S_IWUSR)

        # backup binaries
        backup_bindaries_dir = os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, "bin_backup")
        logger.debug(f"backing up to {backup_bindaries_dir}")
        await asyncio.to_thread(shutil.copytree,
                                os.path.join(plugin_dir, "bin"),
                                backup_bindaries_dir,
                                dirs_exist_ok=True)

        # remove old plugin
        await asyncio.to_thread(shutil.rmtree, plugin_dir)

        logger.debug(f"extracting ota file to {plugin_dir}")
        await asyncio.to_thread(
            shutil.unpack_archive,
            downloaded_filepath,
            str(Path(plugin_dir).parent),
            format="zip",
        )

        # recover old binaries
        logger.debug(f"recovering old binaries")
        await asyncio.to_thread(shutil.copytree,
                                backup_bindaries_dir,
                                os.path.join(plugin_dir, "bin"),
                                dirs_exist_ok=True)
        
        os.chmod(core.CoreController.CORE_PATH, 0o755)
        os.chmod(config.YQ_PATH, 0o755)

        # cleanup downloaded files
        logger.debug(f"cleaning up")
        remove_no_fail(downloaded_filepath)
        await asyncio.to_thread(shutil.rmtree, backup_bindaries_dir)

        logger.info("upgrade complete")
        await restart_plugin_loader()

async def upgrade_to_latest_core(timeout: float, download_timeout) -> None:
    logger.info("upgrading to latest version of core")
    downloaded_filepath = await download_latest_core(timeout, download_timeout)
    core_path = core.CoreController.CORE_PATH

    if os.path.exists(downloaded_filepath):
        logger.debug(f"removing old plugin from {core_path}")
        # remove old plugin
        remove_no_fail(core_path)

        logger.debug(f"extracting ota file to {core_path}")
        def _impl():
            with gzip.open(downloaded_filepath, "rb") as f, open(core_path, "wb") as d:
                    d.write(f.read())
        await asyncio.to_thread(_impl)
        os.chmod(core_path, 0o755)
        # cleanup downloaded files
        remove_no_fail(downloaded_filepath)

        logger.info("upgrade complete")

async def upgrade_to_latest_yq(timeout: float, download_timeout) -> None:
    logger.info("upgrading to latest version of core")
    downloaded_filepath = await download_latest_yq(timeout, download_timeout)
    yq_path = config.YQ_PATH

    if os.path.exists(downloaded_filepath):
        logger.debug(f"removing old plugin from {yq_path}")
        # remove old plugin
        remove_no_fail(yq_path)

        logger.debug(f"extracting ota file to {yq_path}")

        shutil.move(downloaded_filepath, yq_path)
        os.chmod(yq_path, 0o755)

        logger.info("upgrade complete")


async def download_latest_build(timeout: float, download_timeout: float) -> str:
    json_data = await utils.get_url_to_json(get_github_api_url(PACKAGE_REPO), timeout)

    download_url = json_data.get("assets")[0].get("browser_download_url")

    logger.debug(f"downloading from: {download_url}")

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
    logger.debug(f"downloading from: {download_url}")

    file_path = os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, "mihomo.gz")

    await utils.get_url_to_file(download_url, file_path, download_timeout)

    return file_path


async def download_latest_yq(timeout: float, download_timeout: float) -> str:
    json_data = await utils.get_url_to_json(get_github_api_url(YQ_REPO), timeout)

    download_url: Optional[str] = None
    for asset in json_data.get("assets"):
        name: str = asset.get("name")
        if name == "yq_linux_amd64":
            download_url = asset.get("browser_download_url")
            break

    if not download_url:
        logger.error("Failed to find download url")
        return ""
    logger.debug(f"downloading from: {download_url}")

    file_path = os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, "yq_bin")

    await utils.get_url_to_file(download_url, file_path, download_timeout)

    return file_path


def get_version() -> str:
    return f"{decky.DECKY_PLUGIN_VERSION}"

QUERY_HISTORY: Dict[str, Tuple[str, float]] = {}

async def get_latest_version(repo: str, timeout: float, debounce_time: float) -> str:
    if repo in QUERY_HISTORY:
        last_query, last_time = QUERY_HISTORY[repo]
        if time.time() - last_time <= debounce_time:
            return last_query

    try:
        json_data = await utils.get_url_to_json(get_github_api_url(repo), timeout=timeout)
    except Exception as e:
        logger.error(f"get_latest_version: failed with {e}")
        return ""

    tag = json_data.get("tag_name")
    if tag.startswith("v"):
        tag = tag[1:]

    QUERY_HISTORY[repo] = (tag, time.time())
    return tag

GEO_FILES = {
    "country.mmdb": "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country.mmdb",
    "geosite.dat": "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat",
    "asn.mmdb": "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb",
}

async def download_geos(timeout: float):
    promises = []
    for filename, url in GEO_FILES.items():
        promises.append(
            utils.get_url_to_file(
                url, 
                os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, filename),
                timeout=timeout))
    await asyncio.gather(*promises)

DASHBOARDS: Dict[str, Tuple[str, str]] = {
    "yacd-meta": ("Yacd-meta-gh-pages", "https://github.com/MetaCubeX/yacd/archive/gh-pages.zip"),
    "metacubexd": ("metacubexd-gh-pages", "https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip"),
    "zashboard": ("dist", "https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip"),
}

async def download_dashboards(timeout: float):
    promises = []
    if not os.path.exists(dashboard.DASHBOARD_DIR):
        logger.debug("dashboard dir not exists, creating")
        os.mkdir(dashboard.DASHBOARD_DIR)
    tmpdir = tempfile.mkdtemp()

    async def _impl(filename, subdir, url):
        dest_file = os.path.join(tmpdir, f"{filename}.zip")
        logger.info(f"downloading dashboard to: {dest_file}")
        await utils.get_url_to_file(url, dest_file, timeout=timeout)

        logger.debug(f"extracting dashboard file to {tmpdir}")
        await asyncio.to_thread(
            shutil.unpack_archive,
            dest_file,
            tmpdir,
            format="zip")

        dashboard_dir = os.path.join(dashboard.DASHBOARD_DIR, filename)
        logger.debug(f"removing old dashboard {dashboard_dir}")
        await asyncio.to_thread(shutil.rmtree, dashboard_dir, ignore_errors=True)

        logger.debug(f"copying {filename} dashboard files")
        await asyncio.to_thread(
            shutil.copytree,
            os.path.join(tmpdir, subdir),
            dashboard_dir,
            dirs_exist_ok=True)

    for filename, (subdir, url) in DASHBOARDS.items():
        promises.append(_impl(filename, subdir, url))

    try:
        await asyncio.gather(*promises)
    finally:
        shutil.rmtree(tmpdir)
