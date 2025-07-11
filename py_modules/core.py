import asyncio
import os
from pathlib import Path
import subprocess
from typing import Awaitable, Callable, Optional, List

import decky
from decky import logger
import utils


ExitCallback = Callable[[Optional[int]], Awaitable[None]]

class CoreController:
    CORE_PATH = os.path.join(decky.DECKY_PLUGIN_DIR, "bin", "mihomo")
    CONFIG_PATH = os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, "running_config.yaml")
    RESOURCE_DIR = decky.DECKY_PLUGIN_RUNTIME_DIR

    def __init__(self):

        self._process: Optional[asyncio.subprocess.Process] = None
        self._command: List[str] = []
        self._exit_callback: Optional[ExitCallback] = None
        self._monitor_task: Optional[asyncio.Task] = None

    @property
    def is_running(self) -> bool:
        if not self._process:
            return False
        if self._process.returncode is None:
            return True
        return False
    
    @classmethod
    def _gen_cmd(cls, config_path: str) -> List[str]:
        return [
            cls.CORE_PATH,
            "-f",
            config_path,
            "-d",
            cls.RESOURCE_DIR,
        ]

    async def start(self) -> None:
        if self._process and self._process.returncode is None:
            logger.warning("core is already running")
            await self.stop()

        command = self._gen_cmd(self.CONFIG_PATH)
        logger.info(f"starting core: {' '.join(command)}")
        self._command = command

        log_path = os.path.join(decky.DECKY_PLUGIN_LOG_DIR, "core.log")
        logger.info(f"core log file: {log_path}")
        self._logfile = open(log_path, 'w')

        try:
            self._process = await asyncio.create_subprocess_exec(
                *command,
                stdout=self._logfile,
                stderr=self._logfile,
                env=utils.env_fix(),
            )
            logger.debug(f"core pid: {self._process.pid}")
            self._monitor_task = asyncio.create_task(self._monitor_exit())
        except Exception as e:
            logger.error(f"failed to start core: {str(e)}")
            self._logfile.close()
            self._logfile = None
            raise

    async def stop(self) -> None:
        if not self._process or self._process.returncode is not None:
            raise RuntimeError("No running core")
            
        logger.info(f"terminating core (PID: {self._process.pid})")
        if self._monitor_task is not None:
            self._monitor_task.cancel()
            self._monitor_task = None
        try:
            self._process.terminate()
        except Exception as e:
            logger.error(f"failed to terminate core with error: {e}")
        finally:
            self._process = None
            logger.debug("core terminated")
            if self._logfile:
                self._logfile.close()
                self._logfile = None

    async def _monitor_exit(self):
        assert self._process is not None
        returncode = await self._process.wait()
        logger.debug(f"core exited with code: {returncode}")

        if self._exit_callback is not None:
            try:
                await self._exit_callback(returncode)
            except Exception as e:
                logger.error(f"error in exit callback: {str(e)}")

    def set_exit_callback(self, callback: Optional[ExitCallback]):
        self._exit_callback = callback

    @classmethod
    def check_config(cls, config_path: str) -> bool:
        command = cls._gen_cmd(config_path)
        command.append("-t")
        logger.debug(f"check_config: {' '.join(command)}")

        try:
            return_code = subprocess.call(command)
        except Exception as e:
            logger.error(f"failed to start core: {e}")
            raise

        logger.debug(f"check_config: return code: {return_code}")
        return return_code == 0

    @classmethod
    def get_version(cls) -> str:
        try:
            cmd = [ cls.CORE_PATH, "-v" ]
            logger.debug(f"get_version: cmd: {' '.join(cmd)}")
            output = subprocess.check_output(cmd)
        except Exception as e:
            logger.error(f"get_version: failed to start core: {str(e)}")
            return ""

        logger.debug(f"get_version: output: {output}")
        for s in output.decode().split(" "):
            if s.startswith("v"):
                return s[1:]
        return ""
