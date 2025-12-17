import asyncio
from enum import Enum
import gzip
import os
from pathlib import Path
import shutil
import stat
import tempfile
import time
from typing import Any, Awaitable, Callable, Coroutine, Dict, Tuple

import core
import dashboard
import decky
from decky import logger
from metadata import CORE_REPO, PACKAGE_REPO
import utils
from utils import ProgressCallback
import config

def remove_no_fail(path: str):
    try:
        os.remove(path)
    except FileNotFoundError as e:
        logger.warning(f"remove_no_fail: {e}")
    except Exception as e:
        raise e

def get_latest_release_url(repo: str) -> str:
    return f"https://api.github.com/repos/{repo}/releases/latest"

def get_releases_url(repo: str) -> str:
    return f"https://api.github.com/repos/{repo}/releases"

def recursive_chmod(path: str, perms: int) -> None:
    for dirpath, _, filenames in os.walk(path):
        current_perms = os.stat(dirpath).st_mode
        os.chmod(dirpath, current_perms | perms)
        for filename in filenames:
            os.chmod(os.path.join(dirpath, filename), current_perms | perms)

def recursive_chown(path: str, user: str | int, group: str | int) -> None:
    for dirpath, _, filenames in os.walk(path):
        shutil.chown(dirpath, user, group)
        for filename in filenames:
            shutil.chown(os.path.join(dirpath, filename), user, group)

def ensure_bin_dir() -> None:
    bin_dir = os.path.join(decky.DECKY_PLUGIN_DIR, "bin")
    if not os.path.exists(bin_dir):
        os.mkdir(bin_dir)

def ensure_dashboard_dir() -> None:
    dashboard_dir = dashboard.DASHBOARD_DIR
    if not os.path.exists(dashboard_dir):
        os.mkdir(dashboard_dir)

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

class ResourceType(Enum):
    PLUGIN = "plugin"
    CORE = "core"

RESOURCE_TYPE_ENUMS = [ResourceType.PLUGIN, ResourceType.CORE]
RESOURCE_TYPE_VALUES = [e.value for e in RESOURCE_TYPE_ENUMS]

async def upgrade_plugin(version: str) -> None:
    logger.info("upgrade_plugin: upgrading")
    downloaded_filepath = await download_resourse(ResourceType.PLUGIN, version)

    if os.path.exists(downloaded_filepath):
        plugin_dir = decky.DECKY_PLUGIN_DIR

        logger.debug(f"chmod +w {plugin_dir}")
        # add write perms to directory
        await asyncio.to_thread(recursive_chmod, plugin_dir, stat.S_IWUSR)

        # backup binaries
        binaries_dir = os.path.join(plugin_dir, "bin")
        backup_binaries_dir = os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, "bin_backup")
        if os.path.exists(binaries_dir):
            logger.debug(f"backing up to {backup_binaries_dir}")
            os.makedirs(backup_binaries_dir, exist_ok=True)
            await asyncio.to_thread(shutil.copytree,
                                    binaries_dir,
                                    backup_binaries_dir,
                                    dirs_exist_ok=True)

        # remove old plugin
        await asyncio.to_thread(shutil.rmtree, plugin_dir)

        logger.debug(f"extracting ota file to {plugin_dir}")
        with tempfile.TemporaryDirectory() as tmp_dir:
            await asyncio.to_thread(shutil.unpack_archive,
                                    downloaded_filepath,
                                    tmp_dir,
                                    format="zip")
            await asyncio.to_thread(shutil.copytree,
                                    os.path.join(tmp_dir, "DeckyClash"),
                                    plugin_dir,
                                    dirs_exist_ok=True)

        # recover old binaries
        if os.path.exists(backup_binaries_dir):
            logger.debug(f"recovering old binaries")
            await asyncio.to_thread(shutil.copytree,
                                    backup_binaries_dir,
                                    binaries_dir,
                                    dirs_exist_ok=True)
            await asyncio.to_thread(shutil.rmtree, backup_binaries_dir)
        
        await asyncio.to_thread(recursive_chmod, binaries_dir, stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
        await asyncio.to_thread(recursive_chown, decky.DECKY_PLUGIN_DIR, decky.DECKY_USER, decky.DECKY_USER)

        # cleanup downloaded files
        logger.debug(f"cleaning up")
        remove_no_fail(downloaded_filepath)

        logger.info("upgrade_plugin: complete")
        await restart_plugin_loader()

async def upgrade_core(version: str) -> None:
    logger.info("upgrade_core: upgrading")
    downloaded_filepath = await download_resourse(ResourceType.CORE, version)
    core_path = core.CoreController.CORE_PATH

    if os.path.exists(downloaded_filepath):
        ensure_bin_dir()
        logger.debug(f"removing old core from {core_path}")
        # remove core plugin
        remove_no_fail(core_path)

        logger.debug(f"extracting core to {core_path}")
        def _impl():
            with gzip.open(downloaded_filepath, "rb") as f, open(core_path, "wb") as d:
                    d.write(f.read())
        await asyncio.to_thread(_impl)
        os.chmod(core_path, 0o755)
        shutil.chown(core_path, decky.DECKY_USER, decky.DECKY_USER)
        # cleanup downloaded files
        remove_no_fail(downloaded_filepath)

        logger.info("upgrade_core: complete")

_FUNC_MAP: Dict[ResourceType, Callable[[str], Coroutine[Any, Any, None]]] = {
    ResourceType.PLUGIN: upgrade_plugin,
    ResourceType.CORE: upgrade_core,
}

_URL_MAP: Dict[ResourceType, Callable[[str], str]] = {
    ResourceType.PLUGIN: lambda ver: f"https://github.com/{PACKAGE_REPO}/releases/download/{ver}/DeckyClash.zip",
    ResourceType.CORE: lambda ver: f"https://github.com/{CORE_REPO}/releases/download/{ver}/mihomo-linux-amd64-{ver}.gz",
}

async def download_resourse(res: ResourceType, version: str) -> str:
    url = _URL_MAP[res](version)
    name = url.split("/")[-1]
    event = f"dl_{res.value}_progress"
    def emitter(percent: int) -> Awaitable:
        return decky.emit(event, percent)

    return await utils.download_with_progress(url, name, emitter)

_upgrade_tasks: Dict[ResourceType, asyncio.Task] = {}
async def upgrade(res: ResourceType, version: str) -> None:
    if res in _upgrade_tasks:
        if _upgrade_tasks[res].done():
            _upgrade_tasks.pop(res)
        logger.warning(f"upgrade: {res.value} is already upgrading")
    if res not in _upgrade_tasks:
        logger.info(f"upgrade: {res.value} upgrading to {version}")
        _upgrade_tasks[res] = asyncio.create_task(_FUNC_MAP[res](version))
    await _upgrade_tasks[res]
    err = _upgrade_tasks[res].exception()
    if _upgrade_tasks[res].cancelled():
        logger.warning(f"upgrade: {res.value} upgrade cancelled")
    elif err is not None:
        logger.error(f"upgrade: {res.value} upgrade failed with {type(err)} {err}")
        raise err
    else:
        logger.info(f"upgrade: {res.value} upgrade done")
    _upgrade_tasks.pop(res)

def is_upgrading(res: ResourceType) -> bool:
    return res in _upgrade_tasks and not _upgrade_tasks[res].done()

def cancel_upgrade(res: ResourceType) -> None:
    if res not in _upgrade_tasks:
        return
    rtn = _upgrade_tasks[res].cancel()
    logger.info(f"cancel_upgrade: {res.value} {rtn}")

_REPO_MAP: Dict[ResourceType, str] = {
    ResourceType.CORE: CORE_REPO,
    ResourceType.PLUGIN: PACKAGE_REPO,
}
_query_history: Dict[ResourceType, Tuple[str, float]] = {}
async def get_latest_version(res: ResourceType, timeout: float, debounce_time: float) -> str:
    if res in _query_history:
        last_query, last_time = _query_history[res]
        if time.time() - last_time <= debounce_time:
            return last_query

    json_data = await utils.get_url_to_json(
        get_latest_release_url(_REPO_MAP[res]),
        timeout=timeout)

    tag = json_data.get("tag_name")

    _query_history[res] = (tag, time.time())
    return tag

_GEO_FILES = {
    "country.mmdb": "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country.mmdb",
    "geosite.dat": "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat",
    "asn.mmdb": "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb",
}

async def download_geos():
    promises = []
    async def _impl(filename, url):
        path = os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, filename)
        await utils.get_url_to_file(url, path)
        shutil.chown(path, decky.DECKY_USER, decky.DECKY_USER)

    for filename, url in _GEO_FILES.items():
        promises.append(_impl(filename, url))
    await asyncio.gather(*promises)

async def download_dashboards():
    promises = []
    if not os.path.exists(dashboard.DASHBOARD_DIR):
        logger.debug("dashboard dir not exists, creating")
        os.mkdir(dashboard.DASHBOARD_DIR)

    async def _impl(filename, url):
        dest_file = os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, f"{filename}.zip")
        logger.info(f"downloading dashboard to: {dest_file}")
        await utils.get_url_to_file(url, dest_file)

        with tempfile.TemporaryDirectory() as tmpdir:
            logger.debug(f"extracting dashboard file to {tmpdir}")
            await asyncio.to_thread(
                shutil.unpack_archive,
                dest_file,
                tmpdir,
                format="zip")

            dashboard_dir = os.path.join(dashboard.DASHBOARD_DIR, filename)
            logger.debug(f"removing old dashboard {dashboard_dir}")
            await asyncio.to_thread(shutil.rmtree, dashboard_dir, ignore_errors=True)

            subdir = None
            for name in os.listdir(tmpdir):
                if os.path.isdir(os.path.join(tmpdir, name)):
                    subdir = name
                    break
            if not subdir:
                logger.warning(f"{filename} dashboard subdir not found, using root")
                fullpath = tmpdir
            else:
                fullpath = os.path.join(tmpdir, subdir)

            logger.debug(f"copying {filename} dashboard files")
            await asyncio.to_thread(
                shutil.copytree,
                fullpath,
                dashboard_dir,
                dirs_exist_ok=True)

        await asyncio.to_thread(recursive_chown,
                                dashboard_dir,
                                decky.DECKY_USER,
                                decky.DECKY_USER)
        remove_no_fail(dest_file)

    for filename, url in dashboard.BUILTIN_DASHBOARDS.items():
        promises.append(_impl(filename, url))

    try:
        await asyncio.gather(*promises)
    except Exception as e:
        logger.error(f"download_dashboards: error {e}")

def initialize_plugin() -> None:
    recursive_chmod(os.path.join(decky.DECKY_PLUGIN_DIR, "bin"), 0o755)
    data_path = os.path.join(decky.DECKY_PLUGIN_DIR, "data")
    if os.path.exists(data_path):
        shutil.copytree(data_path, decky.DECKY_PLUGIN_RUNTIME_DIR, dirs_exist_ok=True)
        shutil.rmtree(data_path)
        recursive_chown(decky.DECKY_PLUGIN_RUNTIME_DIR, decky.DECKY_USER, decky.DECKY_USER)
