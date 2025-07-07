import { FC, useLayoutEffect, useState } from "react";
import { DialogBody, DropdownItem } from "@decky/ui";
import { t } from 'i18next';
import { L } from "../i18n";
import { backend } from "../backend";
import { UpgradeItem } from "../components/UpgradeItem";
import { toaster } from "@decky/api";
import { BsCheckCircleFill, BsExclamationCircleFill } from "react-icons/bs";

export const Upgrade: FC = () => {
  const [pluginCurrent, setPluginCurrent] = useState<string>("");
  const [pluginLatest, setPluginLatest] = useState<string>("");
  const [coreCurrent, setCoreCurrent] = useState<string>("");
  const [coreLatest, setCoreLatest] = useState<string>("");
  const [yqCurrent, setYqCurrent] = useState<string>("");
  const [yqLatest, setYqLatest] = useState<string>("");
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

  const upgradePlugin = async () => {
    const [success, error] = channel === "nightly" ?
      await backend.upgradeToNightly() :
      await backend.upgradeToLatest();
    if (success) {
      toaster.toast({
        title: t(L.INSTALL_SUCCESS),
        body: `DeckyClash ${coreLatest}`,
        icon: <BsCheckCircleFill />,
      });
      getVersions();
    } else {
      toaster.toast({
        title: t(L.INSTALL_FAILURE),
        body: `DeckyClash: ${error}`,
        icon: <BsExclamationCircleFill />,
      });
    }
  };

  const upgradeCore = async () => {
    const [success, error] = await backend.upgradeToLatestCore();
    if (success) {
      toaster.toast({
        title: t(L.INSTALL_SUCCESS),
        body: `Mihomo ${coreLatest}`,
        icon: <BsCheckCircleFill />,
      });
      getVersions();
    } else {
      toaster.toast({
        title: t(L.INSTALL_FAILURE),
        body: `Mihomo: ${error}`,
        icon: <BsExclamationCircleFill />,
      });
    }
  };

  const upgradeYq = async () => {
    const [success, error] = await backend.upgradeToLatestYq();
    if (success) {
      toaster.toast({
        title: t(L.INSTALL_SUCCESS),
        body: `yq ${coreLatest}`,
        icon: <BsCheckCircleFill />,
      });
      getVersions();
    } else {
      toaster.toast({
        title: t(L.INSTALL_FAILURE),
        body: `yq: ${error}`,
        icon: <BsExclamationCircleFill />,
      });
    }
  };

  return (
    <DialogBody>
      <UpgradeItem label={t(L.PLUGIN)} current={pluginCurrent} latest={pluginLatest} onClick={upgradePlugin}>
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
      <UpgradeItem label="Mihomo" current={coreCurrent} latest={coreLatest} onClick={upgradeCore} />
      <UpgradeItem label="YQ" current={yqCurrent} latest={yqLatest} onClick={upgradeYq} />
    </DialogBody>
  );
};
