from http.client import HTTPResponse
import json
import logging
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
from metadata import CORE_REPO, PACKAGE_NAME, PACKAGE_REPO, YQ_REPO
from settings import SettingsManager
import utils
import extract


class Plugin:
    # Asyncio-compatible long-running code, executed in a task when the plugin is loaded
    async def _main(self):
        self.settings = SettingsManager(
            name="config", settings_directory=decky.DECKY_PLUGIN_SETTINGS_DIR
        )
        logger.info(f"starting {PACKAGE_NAME} ...")
        await extract.extract_all()

        self._set_default("subscriptions", {})
        self._set_default("secret", utils.rand_thing())
        self._set_default("override_dns", True)
        self._set_default("enhanced_mode", config.EnhancedMode.FakeIP.value)
        self._set_default("controller_port", 9090)
        self._set_default("external_port", 50581)
        self._set_default("allow_remote_access", False)
        self._set_default("autostart", False)
        self._set_default("timeout", 15.0)
        self._set_default("debounce_time", 10.0)
        self._set_default("disable_verify", False)
        self._set_default("external_run_bg", False)
        self._set_default("log_level", logging.getLevelName(logging.INFO))

        level = self._get("log_level")
        logger.setLevel(logging.getLevelNamesMapping()[level])
        logger.info(f"log level set to {level}")
        logger.debug(f"os: {os.uname()}")
        logger.debug(f"environments: {os.environ}")
        logger.debug(f"settings: {self.settings.settings}")

        utils.init_ssl_context(self._get("disable_verify"))

        self.core = CoreController()
        self.core.set_exit_callback(lambda x: decky.emit("core_exit", x))
        if self._get("autostart"):
            await self.core.start()

        self.external = ExternalServer()
        from aiohttp import web
        async def _callback(request: web.Request) -> web.Response:
            import http
            try:
                link = request.query.get("link")
                if link is None:
                    raise ValueError("missing link query")
                success, error = await self.download_subscription(link)
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
        if self._get("external_run_bg"):
            await self.set_external_status(True)

    # Function called first during the unload process, utilize this to handle your plugin being removed
    async def _unload(self):
        if self.core.is_running:
            await self.core.stop()

    def generate_config(self):
        return config.generate_config(
            subscription.get_path(self._get("current")),
            CoreController.CONFIG_PATH,
            self._get("secret"),
            self._get("override_dns"),
            config.EnhancedMode(self._get("enhanced_mode")),
            self._get("controller_port"),
            self._get("allow_remote_access"),
            str(dashboard.DASHBOARD_DIR),
            self._get("dashboard", True)
        )

    async def get_core_status(self) -> bool:
        is_running = self.core.is_running
        logger.debug(f"get_core_status: {is_running}")
        return is_running

    async def set_core_status(self, status: bool) -> Tuple[bool, Optional[str]]:
        try:
            if status:
                await self.generate_config()
                await self.core.start()
            else:
                await self.core.stop()
        except Exception as e:
            logger.error(f"set_core_status: failed with {e}")
            return False, str(e)
        return True, None

    async def restart_core(self) -> bool:
        logger.debug("soft restarting core ...")
        await self.generate_config()
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
            "allow_remote_access": self._get("allow_remote_access"),
            "autostart": self._get("autostart"),
            "dashboard": self._get("dashboard", True),
            "controller_port": self._get("controller_port"),
        }
        logger.debug(config)
        return config

    async def get_config_value(self, key: str):
        return self.settings.getSetting(key)

    async def set_config_value(self, key: str, value: Any):
        PERMITTED_KEYS = [
            "override_dns",
            "enhanced_mode",
            "allow_remote_access",
            "autostart",
            "dashboard",
            "external_run_bg",
        ]
        if key not in PERMITTED_KEYS:
            logger.error(f"not permitted key: {key}")
            return
        self.settings.setSetting(key, value)
        logger.debug(f"save config: {key} : {value}")

    async def get_version(self, res: str) -> str:
        try:
            match res:
                case "plugin":
                    version = decky.DECKY_PLUGIN_VERSION
                case "core":
                    version = CoreController.get_version()
                case "yq":
                    version = config.get_yq_version()
                case _:
                    version = ""
        except Exception as e:
            logger.error(f"get_version: {res} failed with {type(e)} {e}")
            return ""
        logger.debug(f"get_version: {res} {version}")
        return version

    async def get_dashboard_list(self) -> List[str]:
        dashboard_list = dashboard.get_dashboard_list()
        logger.debug(f"get_dashboard_list: {dashboard_list}")
        return dashboard_list

    async def get_subscription_list(self) -> Dict[str, str]:
        subs: subscription.SubscriptionDict = self.settings.getSetting("subscriptions")
        logger.debug(f"get_subscription_list: ori {type(subs)} {subs}")
        failed = subscription.check_subs(subs)
        if len(failed) > 0:
            [subs.pop(x) for x in failed]
            self.settings.setSetting("subscriptions", subs)
        logger.debug(f"get_subscription_list: {subs}")
        return subs

    async def update_subscription(self, name: str) -> Tuple[bool, Optional[str]]:
        logger.error(f"updating subscription: {name}")
        subs: subscription.SubscriptionDict = self.settings.getSetting("subscriptions")
        if name not in subs:
            logger.error(f"subscription {name} not found")
            return False, "subscription not found"
        result = await subscription.update_sub(name, subs[name], self._get("timeout"))
        if result is None:
            return True, None
        else:
            return False, result

    async def duplicate_subscription(self, name: str) -> None:
        subs: subscription.SubscriptionDict = self.settings.getSetting("subscriptions")
        new_name = subscription.duplicate_sub(subs, name)
        if new_name is not None:
            logger.info(f"duplicated subscription: {name} to {new_name}")
            subs[new_name] = subs[name]
            self.settings.setSetting("subscriptions", subs)

    async def edit_subscription(self, name: str, new_name: str, new_url: str) -> None:
        subs: subscription.SubscriptionDict = self.settings.getSetting("subscriptions")
        new_name = utils.sanitize_filename(new_name)
        logger.info(f"edit_subscription: {name} => {new_name}, {new_url}")
        if name in subs:
            if new_name == name:
                subs[name] = new_url
            elif new_name in subs:
                logger.error(f"edit_subscription: duplicated name {new_name}")
                return
            else:
                try:
                    new_path = subscription.get_path(new_name)
                    if os.path.exists(new_path):
                        os.remove(new_path)
                    shutil.move(subscription.get_path(name), new_path)
                except Exception as e:
                    logger.error(f"edit_subscription: move error {e}")
                    return
                subs.pop(name)
                subs[new_name] = new_url
            self.settings.setSetting("subscriptions", subs)
        else:
            logger.error(f"edit_subscription: {name} not found")

    async def download_subscription(self, url: str) -> Tuple[bool, Optional[str]]:
        subs: subscription.SubscriptionDict = self.settings.getSetting("subscriptions")
        ok, data = subscription.download_sub(url, subs, self._get("timeout"))
        if ok:
            name, url = data
            subs[name] = url
            self.settings.setSetting("subscriptions", subs)
            if self.settings.getSetting("current") is None:
                self.settings.setSetting("current", name)
            await decky.emit("sub_update", name)
            return True, None
        else:
            return False, data # type: ignore

    async def remove_subscription(self, name: str) -> None:
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

    async def set_current(self, name: str) -> bool:
        logger.debug(f"setting current to: {name}")
        if name in self.settings.getSetting("subscriptions"):
            self.settings.setSetting("current", name)
            return True
        else:
            return False

    async def reorder_subscriptions(self, names: List[str]) -> None:
        subs: subscription.SubscriptionDict = self.settings.getSetting("subscriptions")
        logger.debug(f"reorder_subscriptions: current: {subs.keys()} target: {names}")
        if set(names) != set(subs.keys()):
            logger.error(f"reorder_subscriptions: unmatched target")
            return
        self.settings.setSetting("subscriptions", {k: subs[k] for k in names})

    async def get_ip(self) -> str:
        return utils.get_ip()

    async def set_external_status(self, status: bool) -> None:
        if status:
            await self.external.run(self._get("external_port"))
        else:
            await self.external.stop()

    def _get(self, key: str, allow_none: bool = False) -> Any:
        if allow_none:
            return self.settings.getSetting(key)
        else:
            value = self.settings.getSetting(key)
            if value is None:
                raise ValueError(f'Value of "{key}" is None')
            return value

    def _set_default(self, key: str, value: Any):
        if not self.settings.getSetting(key):
            self.settings.setSetting(key, value)
