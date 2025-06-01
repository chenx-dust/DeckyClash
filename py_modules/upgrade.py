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

def get_github_api_url(repo: str) -> str:
    return f"https://api.github.com/repos/{repo}/releases/latest"

def recursive_chmod(path, perms):
    for dirpath, dirnames, filenames in os.walk(path):
        current_perms = os.stat(dirpath).st_mode
        os.chmod(dirpath, current_perms | perms)
        for filename in filenames:
            os.chmod(os.path.join(dirpath, filename), current_perms | perms)


def upgrade_to_latest():
    logger.info("upgrading to latest version")
    downloaded_filepath = download_latest_build()

    if os.path.exists(downloaded_filepath):
        plugin_dir = decky.DECKY_PLUGIN_DIR

        try:
            logger.info(f"removing old plugin from {plugin_dir}")
            # add write perms to directory
            recursive_chmod(plugin_dir, stat.S_IWUSR)

            # remove old plugin
            shutil.rmtree(plugin_dir)
        except Exception as e:
            logger.error(f"ota error during removal of old plugin: {e}")

        try:
            logger.info(f"extracting ota file to {plugin_dir}")
            # extract files to decky plugins dir
            shutil.unpack_archive(
                downloaded_filepath,
                f"{decky.DECKY_USER_HOME}/homebrew/plugins",
                format="zip",
            )

            # cleanup downloaded files
            os.remove(downloaded_filepath)
        except Exception as e:
            logger.error(f"error during ota file extraction {e}")

        logger.info("restarting plugin_loader.service")
        cmd = "systemctl restart plugin_loader.service"
        result = subprocess.run(
            cmd,
            shell=True,
            check=True,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        logger.info(result.stdout)
        return result
    

def upgrade_to_latest_core():
    logger.info("upgrading to latest version of core")
    downloaded_filepath = download_latest_core()

    if os.path.exists(downloaded_filepath):
        plugin_dir = decky.DECKY_PLUGIN_DIR

        try:
            logger.info(f"removing old plugin from {plugin_dir}")
            # add write perms to directory
            recursive_chmod(plugin_dir, stat.S_IWUSR)

            # remove old plugin
            shutil.rmtree(plugin_dir)
        except Exception as e:
            logger.error(f"ota error during removal of old plugin: {e}")

        try:
            logger.info(f"extracting ota file to {plugin_dir}")
            # extract files to decky plugins dir
            # shutil.unpack_archive(
            #     downloaded_filepath,
            #     f"{decky.DECKY_USER_HOME}/homebrew/plugins",
            #     format="zip",
            # )
            with gzip.open(downloaded_filepath, "rb") as f:
                with open(core.CoreController.CORE_PATH, "wb") as d:
                    d.write(f.read())
            
            os.chmod(core.CoreController.CORE_PATH, 0o777)

            # cleanup downloaded files
            os.remove(downloaded_filepath)
        except Exception as e:
            logger.error(f"error during ota file extraction {e}")


def download_latest_build():
    gcontext = ssl.SSLContext()

    response = urllib.request.urlopen(get_github_api_url(PACKAGE_REPO), context=gcontext)
    json_data = json.load(response)

    download_url = json_data.get("assets")[0].get("browser_download_url")

    logger.info(f"downloading from: {download_url}")

    file_path = Path(decky.DECKY_PLUGIN_RUNTIME_DIR, decky.DECKY_PLUGIN_NAME + ".zip")

    with urllib.request.urlopen(download_url, context=gcontext) as response, open(
        file_path, "wb"
    ) as output_file:
        output_file.write(response.read())
        output_file.close()

    return file_path


def download_latest_core():
    gcontext = ssl.SSLContext()

    response = urllib.request.urlopen(get_github_api_url(CORE_REPO), context=gcontext)
    json_data = json.load(response)

    download_url: Optional[str] = None
    for asset in json_data.get("assets"):
        name: str = asset.get("name")
        if name.startswith("mihomo-linux-amd64-") and name.endswith(".gz"):
            download_url = asset.get("browser_download_url")
            break

    if not download_url:
        logger.error("Failed to find download url")
        raise Exception("Failed to find download url")
    logger.info(f"downloading from: {download_url}")

    file_path = Path(decky.DECKY_PLUGIN_RUNTIME_DIR, "mihomo.gz")

    with urllib.request.urlopen(download_url, context=gcontext) as response, open(
        file_path, "wb"
    ) as output_file:
        output_file.write(response.read())
        output_file.close()

    return file_path


def get_version():
    return f"{decky.DECKY_PLUGIN_VERSION}"

def get_latest_version(repo: str):
    gcontext = ssl.SSLContext()

    response = urllib.request.urlopen(get_github_api_url(repo), context=gcontext)
    json_data = json.load(response)

    tag = json_data.get("tag_name")
    # if tag is a v* tag, remove the v
    if tag.startswith("v"):
        tag = tag[1:]
    else:
        return ""
    return tag
