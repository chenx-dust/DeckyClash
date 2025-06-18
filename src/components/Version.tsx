import { PanelSection, PanelSectionRow, Field } from "@decky/ui";
import { createContext, FC, useContext, useLayoutEffect } from "react";
import * as backend from "../backend/backend";
import { ActionButtonItem } from "./ActionButtonItem";
import { localizationManager, L } from "../i18n";
import { BsExclamationCircleFill, BsCheckCircleFill } from "react-icons/bs";
import { toaster } from "@decky/api";

class VersionData {
  current: string;
  latest: string;
  constructor(current: string = "", latest: string = "") {
    this.current = current;
    this.latest = latest;
  }
}
export const PluginVersionContext = createContext<VersionData>(
  new VersionData()
);
export const CoreVersionContext = createContext<VersionData>(
  new VersionData()
);

export const VersionComponent: FC = () => {
  const pluginVersionData = useContext(PluginVersionContext);
  const coreVersionData = useContext(CoreVersionContext);

  const getVersions = () => {
    backend.getVersion().then((x) => { pluginVersionData.current = x });
    backend.getLatestVersion().then((x) => { pluginVersionData.latest = x });
    backend.getVersionCore().then((x) => { coreVersionData.current = x });
    backend.getLatestVersionCore().then((x) => { coreVersionData.latest = x });
  }
  useLayoutEffect(getVersions, []);

  let uptButtonText = localizationManager.getString(L.REINSTALL_PLUGIN);
  if (pluginVersionData.current !== pluginVersionData.latest && Boolean(pluginVersionData.latest)) {
    uptButtonText =
      localizationManager.getString(L.UPDATE_TO) + ` ${pluginVersionData.latest}`;
  }

  let uptButtonTextCore = localizationManager.getString(L.REINSTALL_CORE);
  if (coreVersionData.current !== coreVersionData.latest && Boolean(coreVersionData.latest)) {
    uptButtonTextCore =
      localizationManager.getString(L.UPDATE_TO_CORE) + ` ${coreVersionData.latest}`;
  }

  return (
    <PanelSection title={localizationManager.getString(L.VERSION)}>
      <PanelSectionRow>
        {/* temporarily disabled due to bug */}
        {/* <ActionButtonItem
          layout="below"
          onClick={() => backend.upgradeToLatest().then(([success, reason]) => {
            if (success) {
              toaster.toast({
                title: localizationManager.getString(L.PLUGIN_INSTALLED),
                body: pluginVersionData.latest,
                icon: <BsCheckCircleFill />,
              });
            } else {
              toaster.toast({
                title: localizationManager.getString(L.PLUGIN_INSTALL_FAILED),
                body: reason,
                icon: <BsExclamationCircleFill />,
              });
            }
          })}
        >
          {uptButtonText}
        </ActionButtonItem> */}
      </PanelSectionRow>
      <PanelSectionRow>
        <Field
          focusable
          label={localizationManager.getString(L.INSTALLED_VERSION)}
        >
          {pluginVersionData.current}
        </Field>
      </PanelSectionRow>
      {Boolean(pluginVersionData.latest) && (
        <PanelSectionRow>
          <Field
            focusable
            label={localizationManager.getString(L.LATEST_VERSION)}
          >
            {pluginVersionData.latest}
          </Field>
        </PanelSectionRow>
      )}
      <PanelSectionRow>
        {/* temporarily disabled due to bug */}
        {/* <ActionButtonItem
          layout="below"
          onClick={() => backend.upgradeToLatestCore().then(([success, reason]) => {
            if (success) {
              toaster.toast({
                title: localizationManager.getString(L.CORE_INSTALLED),
                body: coreVersionData.latest,
                icon: <BsCheckCircleFill />,
              });
              getVersions();
            } else {
              toaster.toast({
                title: localizationManager.getString(L.CORE_INSTALL_FAILED),
                body: reason,
                icon: <BsExclamationCircleFill />,
              });
            }
          })}
        >
          {uptButtonTextCore}
        </ActionButtonItem> */}
      </PanelSectionRow>
      <PanelSectionRow>
        <Field
          focusable
          label={localizationManager.getString(L.INSTALLED_CORE_VERSION)}
        >
          {coreVersionData.current}
        </Field>
      </PanelSectionRow>
      {Boolean(coreVersionData.latest) && (
        <PanelSectionRow>
          <Field
            focusable
            label={localizationManager.getString(L.LATEST_CORE_VERSION)}
          >
            {coreVersionData.latest}
          </Field>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
};
