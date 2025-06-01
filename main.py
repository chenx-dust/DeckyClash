import asyncio
import os
from pathlib import Path
import shutil
import subprocess
from typing import Any

import config
from core import CoreController
import dashboard
import decky
from decky import logger

import upgrade
from metadata import CORE_REPO, PACKAGE_NAME
from settings import SettingsManager
import utils


class Plugin:
    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        self.loop = asyncio.get_event_loop()
        self.settings = SettingsManager(
            name="config", settings_directory=decky.DECKY_PLUGIN_SETTINGS_DIR
        )
        logger.info(f"starting {PACKAGE_NAME} ...")

        if not self.settings.getSetting("initialized", False):
            logger.info("first launched, copying resources ...")
            shutil.copytree(
                Path(decky.DECKY_PLUGIN_DIR, "resource"),
                decky.DECKY_PLUGIN_RUNTIME_DIR,
            )
            self.settings.setSetting("initialized", True)
            self.settings.setSetting("secret", utils.rand_secret())
            self.settings.setSetting("override_dns", True)
            self.settings.setSetting("enhanced_mode", config.EnhancedMode.FakeIP.value)
            self.settings.setSetting("controller_port", 9090)
            self.settings.setSetting("allow_remote_access", False)

        self.core = CoreController()
        self.core.set_exit_callback(lambda x: decky.emit("core_exit", x))

    # Function called first during the unload process, utilize this to handle your plugin being removed
    async def _unload(self):
        await self.core.stop()

    async def get_core_status(self) -> bool:
        return self.core.is_running

    async def set_core_status(self, status: bool) -> None:
        if status:
            path = os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, "running_config.yaml")
            await config.generate_config(
                self._get("current_config"),
                path,
                self._get("secret"),
                self._get("override_dns"),
                self._get("enhanced_mode"),
                self._get("controller_port"),
                self._get("allow_remote_access"),
                str(dashboard.DASHBOARD_DIR),
            )
            await self.core.start(path)
        else:
            await self.core.stop()

    async def get_config(self) -> dict:
        return {
            "current_config": self._get("current_config", True),
            "secret": self._get("secret"),
            "override_dns": self._get("override_dns"),
            "enhanced_mode": self._get("enhanced_mode"),
            "controller_port": self._get("controller_port"),
            "allow_remote_access": self._get("allow_remote_access"),
            "dashboard": self._get("dashboard", True),
        }

    async def get_config_value(self, key):
        return self.settings.getSetting(key)

    async def set_config_value(self, key, value):
        self.settings.setSetting(key, value)
        logger.info(f"save config: {key} : {value}")

    async def upgrade_to_latest(self):
        return upgrade.upgrade_to_latest()

    async def get_version(self):
        version = upgrade.get_version()
        return version

    async def get_latest_version(self):
        version = upgrade.get_latest_version(PACKAGE_NAME)
        return version

    async def upgrade_to_latest_core(self):
        await self.core.stop()
        upgrade.upgrade_to_latest_core()
        return

    async def get_version_core(self):
        version = CoreController.get_version()
        return version

    async def get_latest_version_core(self):
        version = upgrade.get_latest_version(CORE_REPO)
        return version
    
    async def get_dashboard_list(self):
        dashboard_list = dashboard.get_dashboard_list()
        return dashboard_list
    
    def _get(self, key: str, allow_none: bool = False) -> Any:
        if allow_none:
            return self.settings.getSetting(key)
        else:
            return utils.not_none(self.settings.getSetting(key))
