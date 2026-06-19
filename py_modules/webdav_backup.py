import asyncio
import os
import posixpath
import shutil
import tempfile
import urllib.parse
import zipfile
from pathlib import Path
from typing import Optional

import aiohttp

import utils
from decky import logger


SUCCESS_STATUS = {200, 201, 204}
PROPFIND_SUCCESS_STATUS = {200, 207}


def _auth(username: str, password: str) -> Optional[aiohttp.BasicAuth]:
    if username or password:
        return aiohttp.BasicAuth(username, password)
    return None


def _validate_remote_url(remote_url: str) -> None:
    if not remote_url:
        raise ValueError("WebDAV URL is empty")
    if not remote_url.startswith("http://") and not remote_url.startswith("https://"):
        raise ValueError("WebDAV URL must start with http:// or https://")


def _timeout_error(timeout: float) -> TimeoutError:
    return TimeoutError(f"WebDAV request timed out after {timeout} seconds")


def _parent_url(remote_url: str) -> str:
    parsed = urllib.parse.urlsplit(remote_url)
    if parsed.path.endswith("/"):
        parent_path = parsed.path
    else:
        parent_path = posixpath.dirname(parsed.path) + "/"
    if not parent_path.startswith("/"):
        parent_path = "/" + parent_path
    return urllib.parse.urlunsplit((
        parsed.scheme,
        parsed.netloc,
        parent_path,
        "",
        "",
    ))


async def _response_error(response: aiohttp.ClientResponse) -> str:
    body = await response.text()
    if len(body) > 300:
        body = body[:300] + "..."
    return f"HTTP {response.status} {body}"


def _validate_zip_member(name: str) -> None:
    normalized = posixpath.normpath(name.replace("\\", "/"))
    if normalized in ("", "."):
        raise ValueError("Invalid empty path in backup")
    if normalized.startswith("../") or normalized == "..":
        raise ValueError(f"Unsafe path in backup: {name}")
    if normalized.startswith("/") or os.path.isabs(name):
        raise ValueError(f"Absolute path in backup: {name}")


def _create_archive(settings_dir: str, archive_path: str) -> None:
    root = Path(settings_dir)
    if not root.exists():
        raise FileNotFoundError(f"Settings directory not found: {settings_dir}")

    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in root.rglob("*"):
            if path.is_file():
                archive.write(path, path.relative_to(root).as_posix())


def _validate_archive(archive_path: str) -> None:
    if not zipfile.is_zipfile(archive_path):
        raise ValueError("Downloaded file is not a zip archive")
    with zipfile.ZipFile(archive_path) as archive:
        for info in archive.infolist():
            _validate_zip_member(info.filename)


def _clear_directory(path: str) -> None:
    os.makedirs(path, exist_ok=True)
    for name in os.listdir(path):
        child = os.path.join(path, name)
        if os.path.isdir(child) and not os.path.islink(child):
            shutil.rmtree(child)
        else:
            os.remove(child)


def _replace_settings_from_archive(settings_dir: str, archive_path: str) -> None:
    _validate_archive(archive_path)
    with tempfile.TemporaryDirectory() as extract_dir:
        with zipfile.ZipFile(archive_path) as archive:
            archive.extractall(extract_dir)

        _clear_directory(settings_dir)
        shutil.copytree(extract_dir, settings_dir, dirs_exist_ok=True)


async def backup_settings(
    settings_dir: str,
    remote_url: str,
    username: str,
    password: str,
    timeout: float,
) -> None:
    _validate_remote_url(remote_url)
    with tempfile.NamedTemporaryFile("wb", suffix=".zip", delete=False) as archive:
        archive_path = archive.name

    try:
        await asyncio.to_thread(_create_archive, settings_dir, archive_path)
        logger.info(f"backup_settings: uploading settings backup to {remote_url}")
        timeout_cfg = aiohttp.ClientTimeout(total=timeout)
        async with aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(ssl=utils.get_ssl_context()),
            timeout=timeout_cfg,
            auth=_auth(username, password),
        ) as session:
            with open(archive_path, "rb") as data:
                try:
                    async with session.put(remote_url, data=data) as response:
                        body = await response.text()
                        if response.status not in SUCCESS_STATUS:
                            raise RuntimeError(f"WebDAV upload failed: HTTP {response.status} {body}")
                except asyncio.TimeoutError as e:
                    raise _timeout_error(timeout) from e
    finally:
        try:
            os.remove(archive_path)
        except FileNotFoundError:
            pass


async def test_connection(
    remote_url: str,
    username: str,
    password: str,
    timeout: float,
) -> None:
    _validate_remote_url(remote_url)
    directory_url = _parent_url(remote_url)
    logger.info(f"test_connection: probing WebDAV directory {directory_url}")
    timeout_cfg = aiohttp.ClientTimeout(total=timeout)
    async with aiohttp.ClientSession(
        connector=aiohttp.TCPConnector(ssl=utils.get_ssl_context()),
        timeout=timeout_cfg,
        auth=_auth(username, password),
    ) as session:
        try:
            async with session.request(
                "PROPFIND",
                directory_url,
                headers={"Depth": "0"},
            ) as response:
                if response.status not in PROPFIND_SUCCESS_STATUS:
                    raise RuntimeError(f"WebDAV test failed: {await _response_error(response)}")
        except asyncio.TimeoutError as e:
            raise _timeout_error(timeout) from e


async def restore_settings(
    settings_dir: str,
    remote_url: str,
    username: str,
    password: str,
    timeout: float,
) -> None:
    _validate_remote_url(remote_url)
    with tempfile.NamedTemporaryFile("wb", suffix=".zip", delete=False) as archive:
        archive_path = archive.name

    try:
        logger.info(f"restore_settings: downloading settings backup from {remote_url}")
        timeout_cfg = aiohttp.ClientTimeout(total=timeout)
        async with aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(ssl=utils.get_ssl_context()),
            timeout=timeout_cfg,
            auth=_auth(username, password),
        ) as session:
            try:
                async with session.get(remote_url) as response:
                    body = await response.read()
                    if response.status not in SUCCESS_STATUS:
                        text = body.decode(errors="replace")
                        raise RuntimeError(f"WebDAV download failed: HTTP {response.status} {text}")
                    with open(archive_path, "wb") as out:
                        out.write(body)
            except asyncio.TimeoutError as e:
                raise _timeout_error(timeout) from e

        await asyncio.to_thread(_replace_settings_from_archive, settings_dir, archive_path)
    finally:
        try:
            os.remove(archive_path)
        except FileNotFoundError:
            pass
