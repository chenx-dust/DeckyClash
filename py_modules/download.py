import asyncio
from typing import Optional, Callable, Awaitable, Tuple

import aiohttp

from decky import logger
import utils

ProgressCallback = Callable[[int], Awaitable]

class DownloadController:
    def __init__(self):
        self._task: Optional[asyncio.Task] = None
        self._error: Optional[Exception] = None
        self._total_size: int = 0
        self._downloaded_size: int = 0
        self._last_percent: int = 0
        self._progress_callback: Optional[ProgressCallback] = None

    async def _download_impl(self, url: str, path: str) -> None:
        self._downloaded_size = 0
        self._last_percent = 0
        self._error = None
        if self._progress_callback:
            await self._progress_callback(0)
        try:
            async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=utils.get_ssl_context())) as session:
                async with session.get(url) as response:
                    self._total_size = int(response.headers.get("Content-Length", 0))
                    with open(path, "wb") as f:
                        while True:
                            chunk = await response.content.read(128*1024)
                            if not chunk:
                                break
                            f.write(chunk)
                            self._downloaded_size += len(chunk)
                            percent = int(self._downloaded_size / self._total_size * 100)
                            if percent > self._last_percent:
                                self._last_percent = percent
                                logger.debug(f"downloading: {percent}%")
                                if self._progress_callback:
                                    await self._progress_callback(self._last_percent)
        except Exception as e:
            self._error = e
            logger.error(f"download_task: error {e} with type {type(e)}")

    async def download(self, url: str, path: str) -> None:
        if self._task is not None:
            if self._task.done():
                self._task = None
            else:
                logger.warning("download_task: task is still running")
                if self._progress_callback:
                    await self._progress_callback(self._last_percent)
        if self._task is None:
            logger.debug(f"download_task: starting download {url} to {path}")
            self._task = asyncio.create_task(self._download_impl(url, path))
        await self._task
        self._task = None
        if self._error is not None:
            raise self._error
        logger.debug(f"download_task: download complete {url} to {path}")

    def cancel(self) -> None:
        if self._task is not None:
            logger.debug("download_task: cancelling")
            result = self._task.cancel()
            logger.info(f"download_task: cancel {result}")
            self._task = None

    def set_progress_callback(self, callback: Optional[ProgressCallback]) -> None:
        self._progress_callback = callback

    def get_percent(self) -> Optional[int]:
        if self._task is not None:
            if self._task.done():
                self._task = None
        if self._task is None:
            return None
        else:
            return self._last_percent
