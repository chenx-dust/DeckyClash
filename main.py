from http.client import HTTPResponse
import json
import os
from pathlib import Path
import shutil
from typing import Any, Dict, List, Optional, Tuple
import urllib.request

import config
from core import CoreController
import dashboard
import decky
from decky import logger

from external import ExternalServer
import subscription
import upgrade
from metadata import CORE_REPO, PACKAGE_NAME
from settings import SettingsManager
import utils


class Plugin:
    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        self.settings = SettingsManager(
            name="config", settings_directory=decky.DECKY_PLUGIN_SETTINGS_DIR
        )
        logger.info(f"starting {PACKAGE_NAME} ...")

        if not self.settings.getSetting("initialized", False):
            logger.info("first launched, copying resources ...")
            shutil.copytree(
                Path(decky.DECKY_PLUGIN_DIR, "resource"),
                decky.DECKY_PLUGIN_RUNTIME_DIR,
                dirs_exist_ok=True,
            )
        self._set_default("initialized", True)
        self._set_default("subscriptions", {})
        self._set_default("secret", utils.rand_thing())
        self._set_default("override_dns", True)
        self._set_default("enhanced_mode", config.EnhancedMode.FakeIP.value)
        self._set_default("controller_port", 9090)
        self._set_default("external_port", 50581)
        self._set_default("allow_remote_access", False)
        self._set_default("timeout", 15.0)

        self.core = CoreController()
        self.core.set_exit_callback(lambda x: decky.emit("core_exit", x))

        self.external = ExternalServer()
        from aiohttp import web
        def _callback(request: web.Request) -> web.Response:
            import http
            try:
                link = request.query.get("link")
                if link is None:
                    raise ValueError("missing link query")
                success, error = self.download_subscription_impl(link)
                if not success:
                    raise RuntimeError(error)
                return web.Response(status=http.HTTPStatus.OK)
            except ValueError as e:
                logger.error(f"external_callback: value error {e}")
                return web.json_response({"error": str(e)}, status=http.HTTPStatus.BAD_REQUEST)
            except RuntimeError as e:
                logger.error(f"external_callback: runtime error {e}")
                return web.json_response({"error": str(e)}, status=http.HTTPStatus.INTERNAL_SERVER_ERROR)
        self.external.register_callback("/download_sub", _callback)

    # Function called first during the unload process, utilize this to handle your plugin being removed
    async def _unload(self):
        if self.core.is_running:
            await self.core.stop()

    async def get_core_status(self) -> bool:
        is_running = self.core.is_running
        logger.info(f"get_core_status: {is_running}")
        return is_running

    async def set_core_status(self, status: bool) -> None:
        try:
            if status:
                path = os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, "running_config.yaml")
                await config.generate_config(
                    subscription.get_path(self._get("current")),
                    path,
                    self._get("secret"),
                    self._get("override_dns"),
                    self._get("enhanced_mode"),
                    self._get("controller_port"),
                    self._get("allow_remote_access"),
                    str(dashboard.DASHBOARD_DIR),
                    self._get("dashboard")
                )
                await self.core.start(path)
            else:
                await self.core.stop()
        except Exception as e:
            logger.error(f"set_core_status: failed with {e}")

    async def restart_core(self) -> bool:
        logger.info("soft restarting core ...")
        port = self._get("controller_port")
        payload = json.dumps({"payload": ""})
        headers = {
            "Content-Type": "application/json",
            "Authorization": f'Bearer {self._get("secret")}',
        }
        try:
            req = urllib.request.Request(f"http://127.0.0.1:{port}/restart",
                                        data=payload.encode(),
                                        headers=headers,
                                        method="POST")
            resp: HTTPResponse = urllib.request.urlopen(req, timeout=self._get("timeout"))
        except Exception as e:
            logger.error(f"restart_core: failed with {e}")
            return False
        
        if resp.status == 200:
            return True
        else:
            logger.error(f"restart_core: failed with status code {resp.status}")
            return False

    async def get_config(self) -> dict:
        config = {
            "status": self.core.is_running,
            "current": self._get("current", True),
            "secret": self._get("secret"),
            "override_dns": self._get("override_dns"),
            "enhanced_mode": self._get("enhanced_mode"),
            "controller_port": self._get("controller_port"),
            "allow_remote_access": self._get("allow_remote_access"),
            "dashboard": self._get("dashboard", True),
        }
        logger.debug(config)
        return config

    async def get_config_value(self, key: str):
        return self.settings.getSetting(key)

    async def set_config_value(self, key: str, value: Any):
        PERMITTED_KEYS = [
            "current",
            "override_dns",
            "enhanced_mode",
            "allow_remote_access",
            "dashboard",
        ]
        if key not in PERMITTED_KEYS:
            logger.error(f"not permitted key: {key}")
            return
        self.settings.setSetting(key, value)
        logger.debug(f"save config: {key} : {value}")

    async def upgrade_to_latest(self):
        await upgrade.upgrade_to_latest(self._get("timeout"))

    async def get_version(self):
        version = upgrade.get_version()
        logger.info(f"current package version: {version}")
        return version

    async def get_latest_version(self):
        version = upgrade.get_latest_version(PACKAGE_NAME, self._get("timeout"))
        logger.info(f"latest package version: {version}")
        return version

    async def upgrade_to_latest_core(self):
        try:
            await self.core.stop()
        except Exception as e:
            logger.error(f"upgrade_to_latest_core: failed with {e}")
        try:
            await upgrade.upgrade_to_latest_core(self._get("timeout"))
        except Exception as e:
            logger.error(f"upgrade_to_latest_core: failed with {e}")

    async def get_version_core(self):
        version = CoreController.get_version()
        logger.info(f"current core version: {version}")
        return version

    async def get_latest_version_core(self) -> str:
        version = upgrade.get_latest_version(CORE_REPO, self._get("timeout"))
        logger.info(f"latest core version: {version}")
        return version

    async def get_dashboard_list(self) -> List[str]:
        dashboard_list = dashboard.get_dashboard_list()
        logger.debug(f"get_dashboard_list: {dashboard_list}")
        return dashboard_list

    async def get_subscription_list(self) -> Dict[str, str]:
        subs: subscription.SubscriptionDict = self.settings.getSetting("subscriptions")
        failed = subscription.check_subs(subs)
        if len(failed) > 0:
            [subs.pop(x) for x in failed]
            self.settings.setSetting("subscriptions", subs)
        logger.debug(f"get_subscription_list: {subs}")
        return subs

    async def update_all_subscriptions(self) -> List[Tuple[str, str]]:
        subs: subscription.SubscriptionDict = self.settings.getSetting("subscriptions")
        return await subscription.update_subs(subs, self._get("timeout"))

    def download_subscription_impl(self, url: str) -> Tuple[bool, Optional[str]]:
        subs: subscription.SubscriptionDict = self.settings.getSetting("subscriptions")
        ok, data = subscription.download_sub(url, subs, self._get("timeout"))
        if ok:
            name, url = data
            subs[name] = url
            self.settings.setSetting("subscriptions", subs)
            if self.settings.getSetting("current") is None:
                self.settings.setSetting("current", name)
            return True, None
        else:
            return False, data # type: ignore

    async def download_subscription(self, url: str) -> Tuple[bool, Optional[str]]:
        return self.download_subscription_impl(url)

    async def remove_subscription(self, name: str) -> bool:
        logger.info(f"removing subscription: {name}")
        subs: subscription.SubscriptionDict = self.settings.getSetting("subscriptions")
        if name in subs:
            subs.pop(name)
            try:
                os.remove(subscription.get_path(name))
            except Exception as e:
                logger.error(f"remove_subscription: {e}")
            if self.settings.getSetting("current") == name:
                self.settings.setSetting("current", None)
            self.settings.setSetting("subscriptions", subs)
            return True
        else:
            return False

    async def set_current(self, name: str) -> bool:
        logger.info(f"setting current to: {name}")
        if name in self.settings.getSetting("subscriptions"):
            self.settings.setSetting("current", name)
            return True
        else:
            return False

    async def get_external_url(self) -> str:
        return f'http://{utils.get_ip()}:{self._get("external_port")}'
    
    async def set_external_status(self, status: bool) -> None:
        if status:
            await self.external.run(self._get("external_port"))
        else:
            await self.external.stop()

    def _get(self, key: str, allow_none: bool = False) -> Any:
        if allow_none:
            return self.settings.getSetting(key)
        else:
            return utils.not_none(self.settings.getSetting(key))

    def _set_default(self, key: str, value: Any):
        if not self.settings.getSetting(key):
            self.settings.setSetting(key, value)
