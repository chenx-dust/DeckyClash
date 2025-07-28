import { FC, useLayoutEffect, useState } from "react";
import { DialogBody, DropdownItem, Router } from "@decky/ui";
import { t } from 'i18next';
import { L } from "../i18n";
import { backend } from "../backend";
import { UpgradeItem } from "../components/UpgradeItem";
import { toaster } from "@decky/api";
import { BsCheckCircleFill, BsExclamationCircleFill } from "react-icons/bs";

export const Upgrade: FC = () => {
  const [pluginCurrent, setPluginCurrent] = useState<string>();
  const [pluginLatest, setPluginLatest] = useState<string>();
  const [coreCurrent, setCoreCurrent] = useState<string>();
  const [coreLatest, setCoreLatest] = useState<string>();
  const [yqCurrent, setYqCurrent] = useState<string>();
  const [yqLatest, setYqLatest] = useState<string>();
  const [channel, setChannel] = useState<string>(
    window.localStorage.getItem("decky-clash-upgrade-channel") || "latest"
  );

  const getVersions = () => {
    backend.getVersion().then(setPluginCurrent);
    backend.getLatestVersion().then(setPluginLatest);
    backend.getVersionCore().then(setCoreCurrent);
    backend.getLatestVersionCore().then(setCoreLatest);
    backend.getVersionYq().then(setYqCurrent);
    backend.getLatestVersionYq().then(setYqLatest);
  }
  useLayoutEffect(getVersions, []);

  const upgradeCallback = (func: () => Promise<[boolean, string]>, name: string) => {
    return async () => {
      const [success, error] = await func();
      if (success) {
        toaster.toast({
          title: t(L.INSTALL_SUCCESS),
          body: `${name} ${pluginLatest}`,
          icon: <BsCheckCircleFill />,
          onClick: () => {
            Router.CloseSideMenus();
            Router.Navigate("/decky-clash/upgrade");
          },
        });
        getVersions();
      } else {
        toaster.toast({
          title: t(L.INSTALL_FAILURE),
          body: `${name}: ${error}`,
          icon: <BsExclamationCircleFill />,
          onClick: () => {
            Router.CloseSideMenus();
            Router.Navigate("/decky-clash/upgrade");
          },
        });
      }
    };
  }

  const upgradePlugin = upgradeCallback(
    channel === "nightly" ? backend.upgradeToNightly : backend.upgradeToLatest,
    "DeckyClash"
  );
  const upgradeCore = upgradeCallback(backend.upgradeToLatestCore, "Mihomo");
  const upgradeYq = upgradeCallback(backend.upgradeToLatestYq, "yq");

  return (
    <DialogBody>
      <UpgradeItem label={t(L.PLUGIN)} current={pluginCurrent} latest={pluginLatest}
        progressEvent="dl_plugin_progress"
        cancelCallback={backend.cancelUpgrade}
        onCurrentClick={() => {
          setPluginCurrent(undefined);
          backend.getVersion().then(setPluginCurrent);
        }}
        onLatestClick={() => {
          setPluginLatest(undefined);
          backend.getLatestVersion().then(setPluginLatest);
        }}
        onUpgradeClick={upgradePlugin}>
        <DropdownItem
          label={t(L.UPGRADE_CHANNEL)}
          rgOptions={[
            { label: t(L.LATEST_CHANNEL), data: "latest" },
            { label: t(L.NIGHTLY_CHANNEL), data: "nightly" },
          ]}
          selectedOption={channel}
          onChange={(value) => {
            setChannel(value.data);
            window.localStorage.setItem("decky-clash-upgrade-channel", value.data);
          }}
        />
      </UpgradeItem>
      <UpgradeItem label="Mihomo" current={coreCurrent} latest={coreLatest}
        progressEvent="dl_core_progress"
        cancelCallback={backend.cancelUpgradeCore}
        onCurrentClick={() => {
          setCoreCurrent(undefined);
          backend.getVersionCore().then(setCoreCurrent);
        }}
        onLatestClick={() => {
          setCoreLatest(undefined);
          backend.getLatestVersionCore().then(setCoreLatest);
        }}
        onUpgradeClick={upgradeCore} />
      <UpgradeItem label="YQ" current={yqCurrent} latest={yqLatest}
        progressEvent="dl_yq_progress"
        cancelCallback={backend.cancelUpgradeYq}
        onCurrentClick={() => {
          setYqCurrent(undefined);
          backend.getVersionYq().then(setYqCurrent);
        }}
        onLatestClick={() => {
          setYqLatest(undefined);
          backend.getLatestVersionYq().then(setYqLatest);
        }}
        onUpgradeClick={upgradeYq} />
    </DialogBody>
  );
};
