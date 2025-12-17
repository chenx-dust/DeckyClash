import asyncio
import gzip
import os
from pathlib import Path
import shutil
import stat
import tempfile
import time
from typing import Dict, Optional, Tuple

import core
import dashboard
import decky
from decky import logger
import config

def remove_no_fail(path: str):
    try:
        os.remove(path)
    except FileNotFoundError as e:
        logger.warning(f"remove_no_fail: {e}")
    except Exception as e:
        raise e

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

async def extract_core() -> None:
    downloaded_filepath = os.path.join(decky.DECKY_PLUGIN_DIR, "bin", "mihomo.gz")
    core_path = core.CoreController.CORE_PATH

    if os.path.exists(downloaded_filepath):
        logger.info("extracting core ...")
        ensure_bin_dir()
        logger.debug(f"removing old plugin from {core_path}")
        # remove old plugin
        remove_no_fail(core_path)

        logger.debug(f"extracting ota file to {core_path}")
        def _impl():
            with gzip.open(downloaded_filepath, "rb") as f, open(core_path, "wb") as d:
                    d.write(f.read())
        await asyncio.to_thread(_impl)
        os.chmod(core_path, 0o755)
        shutil.chown(core_path, decky.DECKY_USER, decky.DECKY_USER)
        # cleanup downloaded files
        remove_no_fail(downloaded_filepath)

        logger.info("extract_core: complete")

GEO_FILES = [
    "country.mmdb",
    "geosite.dat",
    "asn.mmdb",
]

async def extract_geos():
    for filename in GEO_FILES:
        src = os.path.join(decky.DECKY_PLUGIN_DIR, "bin", filename)
        if not os.path.exists(src):
            continue
        logger.info(f"extracting {filename} ...")
        dest = os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, filename)
        shutil.move(src, dest)
        shutil.chown(dest, decky.DECKY_USER, decky.DECKY_USER)

async def extract_dashboards():
    promises = []
    ensure_dashboard_dir()

    async def _impl(filename):
        dest_file = os.path.join(decky.DECKY_PLUGIN_DIR, "bin", f"{filename}.zip")
        if not os.path.exists(dest_file):
            return

        with tempfile.TemporaryDirectory() as tmpdir:
            logger.info(f"extracting dashboard file to {tmpdir}")
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
                raise Exception(f"{filename} dashboard subdir not found")

            logger.debug(f"copying {filename} dashboard files")
            await asyncio.to_thread(
                shutil.copytree,
                os.path.join(tmpdir, subdir),
                dashboard_dir,
                dirs_exist_ok=True)

        await asyncio.to_thread(recursive_chown,
                                dashboard_dir,
                                decky.DECKY_USER,
                                decky.DECKY_USER)
        remove_no_fail(dest_file)

    for filename in dashboard.BUILTIN_DASHBOARDS:
        promises.append(_impl(filename))

    try:
        await asyncio.gather(*promises)
    except Exception as e:
        logger.error(f"extract_dashboards: error {e}")

async def extract_all() -> None:
    await extract_core()
    await extract_geos()
    await extract_dashboards()
