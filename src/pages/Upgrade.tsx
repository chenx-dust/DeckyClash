import { FC, useLayoutEffect, useState } from "react";
import { DialogBody, DialogControlsSection, DialogControlsSectionHeader, DropdownItem, Router, ToggleField } from "@decky/ui";
import { t } from 'i18next';
import { L } from "../i18n";
import { backend, ResourceType } from "../backend";
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
  const [autoCheckUpdate, setAutoCheckUpdate] = useState(
    (window.localStorage.getItem("decky-clash-auto-check-update") || "true") === "true"
  );

  useLayoutEffect(() => {
    backend.getConfigValue("auto_check_update").then((value) => {
      setAutoCheckUpdate(value);
      window.localStorage.setItem("decky-clash-auto-check-update", value.toString());
    });
  }, []);

  const getVersions = () => {
    backend.getVersion(ResourceType.PLUGIN).then(setPluginCurrent);
    backend.getLatestVersion(ResourceType.PLUGIN).then(setPluginLatest);
    backend.getVersion(ResourceType.CORE).then(setCoreCurrent);
    backend.getLatestVersion(ResourceType.CORE).then(setCoreLatest);
    backend.getVersion(ResourceType.YQ).then(setYqCurrent);
    backend.getLatestVersion(ResourceType.YQ).then(setYqLatest);
  }
  useLayoutEffect(getVersions, []);

  const upgradeCallback = (
    func: () => Promise<[boolean, string]>,
    name: string,
    target: string | undefined
  ) => {
    return async () => {
      const [success, error] = await func();
      if (success) {
        toaster.toast({
          title: t(L.INSTALL_SUCCESS),
          body: `${name} ${target}`,
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
  };

  const upgradePlugin = upgradeCallback(
    () => backend.upgrade(ResourceType.PLUGIN, channel === "nightly" ? "nightly" : pluginLatest),
    "DeckyClash", pluginLatest
  );
  const upgradeCore = upgradeCallback(() => backend.upgrade(ResourceType.CORE, coreLatest), "Mihomo", coreLatest);
  const upgradeYq = upgradeCallback(() => backend.upgrade(ResourceType.YQ, yqLatest), "yq", yqLatest);

  return (
    <DialogBody>
      <DialogControlsSection>
        <DialogControlsSectionHeader>
          {t(L.GENERAL)}
        </DialogControlsSectionHeader>
        <ToggleField
          label={t(L.AUTO_CHECK_UPDATE)}
          checked={autoCheckUpdate}
          onChange={(x) => {
            setAutoCheckUpdate(x);
            backend.setConfigValue("auto_check_update", x).then(() =>
              backend.getConfigValue("auto_check_update").then(setAutoCheckUpdate));
            localStorage.setItem("decky-clash-auto-check-update", x.toString());
          }}
        />
      </DialogControlsSection>
      <UpgradeItem label={t(L.PLUGIN)} current={pluginCurrent} latest={pluginLatest}
        progressEvent="dl_plugin_progress"
        checkUpgrading={() => backend.isUpgrading(ResourceType.PLUGIN)}
        cancelCallback={() => backend.cancelUpgrade(ResourceType.PLUGIN)}
        onCurrentClick={() => {
          setPluginCurrent(undefined);
          backend.getVersion(ResourceType.PLUGIN).then(setPluginCurrent);
        }}
        onLatestClick={() => {
          setPluginLatest(undefined);
          backend.getLatestVersion(ResourceType.PLUGIN).then(setPluginLatest);
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
        checkUpgrading={() => backend.isUpgrading(ResourceType.CORE)}
        cancelCallback={() => backend.cancelUpgrade(ResourceType.CORE)}
        onCurrentClick={() => {
          setCoreCurrent(undefined);
          backend.getVersion(ResourceType.CORE).then(setCoreCurrent);
        }}
        onLatestClick={() => {
          setCoreLatest(undefined);
          backend.getLatestVersion(ResourceType.CORE).then(setCoreLatest);
        }}
        onUpgradeClick={upgradeCore} />
      <UpgradeItem label="YQ" current={yqCurrent} latest={yqLatest}
        progressEvent="dl_yq_progress"
        checkUpgrading={() => backend.isUpgrading(ResourceType.YQ)}
        cancelCallback={() => backend.cancelUpgrade(ResourceType.YQ)}
        onCurrentClick={() => {
          setYqCurrent(undefined);
          backend.getVersion(ResourceType.YQ).then(setYqCurrent);
        }}
        onLatestClick={() => {
          setYqLatest(undefined);
          backend.getLatestVersion(ResourceType.YQ).then(setYqLatest);
        }}
        onUpgradeClick={upgradeYq} />
    </DialogBody>
  );
};
