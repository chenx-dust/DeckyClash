import asyncio
import os
from aiohttp import web
from typing import Awaitable, Callable, Dict
from decky import logger
import decky

EXTERNAL_DIR = os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, "external")

HandlerCallback = Callable[[web.Request], Awaitable[web.Response]]

class ExternalServer:
    def __init__(self):
        self._app = web.Application()
        self._app.router.add_route('*', '/{tail:.*}', self._handle_request)
        self._runner = None
        self._site = None
        self._callback_dict: Dict[str, HandlerCallback] = {}

    async def _handle_request(self, request):
        path = request.path
        if path in self._callback_dict:
            return await self._callback_dict[path](request)
        else:
            file_path = os.path.join(EXTERNAL_DIR, path.lstrip('/'))
            if os.path.isdir(file_path):
                index_path = os.path.join(file_path, "index.html")
                if os.path.exists(index_path):
                    return web.FileResponse(index_path)
                else:
                    raise web.HTTPNotFound()
            if os.path.exists(file_path) and os.path.isfile(file_path):
                return web.FileResponse(file_path)
            if not os.path.splitext(file_path)[1]:
                index_path = os.path.join(file_path, "index.html")
                if os.path.exists(index_path):
                    return web.FileResponse(index_path)
            raise web.HTTPNotFound()

    def register_callback(self, path: str, callback: HandlerCallback):
        if path in self._callback_dict:
            logger.warning(f"external: callback for path {path} already registered, replacing it")
        self._callback_dict[path] = callback

    async def run(self, port: int):
        if self._runner is None:
            logger.info(f"external: starting aiohttp server on port {port}")
            self._runner = web.AppRunner(self._app)
            await self._runner.setup()
            self._site = web.TCPSite(self._runner, host='0.0.0.0', port=port)
            await self._site.start()
        else:
            logger.warning(f"external: server already running on port {port}")

    async def stop(self):
        if self._runner is not None:
            logger.info("external: stopping aiohttp server")
            await self._runner.cleanup()
            self._runner = None
            self._site = None
        else:
            logger.warning("external: server not running")
