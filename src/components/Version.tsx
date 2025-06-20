import { PanelSection, PanelSectionRow, Field } from "@decky/ui";
import { FC, useLayoutEffect, useState } from "react";
import * as backend from "../backend/backend";
import { ActionButtonItem } from "./ActionButtonItem";
import { L } from "../i18n";
import { BsExclamationCircleFill, BsCheckCircleFill } from "react-icons/bs";
import { toaster } from "@decky/api";
import i18n from "i18next";

export const VersionComponent: FC = () => {
  const [pluginCurrent, setPluginCurrent] = useState<string>();
  const [pluginLatest, setPluginLatest] = useState<string>();
  const [coreCurrent, setCoreCurrent] = useState<string>();
  const [coreLatest, setCoreLatest] = useState<string>();

  const getVersions = () => {
    backend.getVersion().then(setPluginCurrent);
    backend.getLatestVersion().then(setPluginLatest);
    backend.getVersionCore().then(setCoreCurrent);
    backend.getLatestVersionCore().then(setCoreLatest);
  }
  useLayoutEffect(getVersions, []);

  let uptButtonText = i18n.t(L.REINSTALL_PLUGIN);
  if (pluginCurrent !== pluginLatest && Boolean(pluginLatest)) {
    uptButtonText =
      i18n.t(L.UPDATE_TO) + ` ${pluginLatest}`;
  }

  let uptButtonTextCore = i18n.t(L.REINSTALL_CORE);
  if (coreCurrent !== coreLatest && Boolean(coreLatest)) {
    uptButtonTextCore =
      i18n.t(L.UPDATE_TO_CORE) + ` ${coreLatest}`;
  }

  return (
    <PanelSection title={i18n.t(L.VERSION)}>
      <PanelSectionRow>
        <ActionButtonItem
          layout="below"
          onClick={() => backend.upgradeToLatest().then(([success, reason]) => {
            if (success) {
              toaster.toast({
                title: i18n.t(L.PLUGIN_INSTALLED),
                body: pluginLatest,
                icon: <BsCheckCircleFill />,
              });
            } else {
              toaster.toast({
                title: i18n.t(L.PLUGIN_INSTALL_FAILED),
                body: reason,
                icon: <BsExclamationCircleFill />,
              });
            }
          })}
        >
          {uptButtonText}
        </ActionButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <Field
          focusable
          label={i18n.t(L.INSTALLED_VERSION)}
        >
          {pluginCurrent}
        </Field>
      </PanelSectionRow>
      {Boolean(pluginLatest) && (
        <PanelSectionRow>
          <Field
            focusable
            label={i18n.t(L.LATEST_VERSION)}
          >
            {pluginLatest}
          </Field>
        </PanelSectionRow>
      )}
      <PanelSectionRow>
        <ActionButtonItem
          layout="below"
          onClick={() => backend.upgradeToLatestCore().then(([success, reason]) => {
            if (success) {
              toaster.toast({
                title: i18n.t(L.CORE_INSTALLED),
                body: coreLatest,
                icon: <BsCheckCircleFill />,
              });
              getVersions();
            } else {
              toaster.toast({
                title: i18n.t(L.CORE_INSTALL_FAILED),
                body: reason,
                icon: <BsExclamationCircleFill />,
              });
            }
          })}
        >
          {uptButtonTextCore}
        </ActionButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <Field
          focusable
          label={i18n.t(L.INSTALLED_CORE_VERSION)}
        >
          {coreCurrent}
        </Field>
      </PanelSectionRow>
      {Boolean(coreLatest) && (
        <PanelSectionRow>
          <Field
            focusable
            label={i18n.t(L.LATEST_CORE_VERSION)}
          >
            {coreLatest}
          </Field>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
};
