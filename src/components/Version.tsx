import { PanelSection, PanelSectionRow, Field } from "@decky/ui";
import { createContext, FC, useContext, useEffect } from "react";
import { getLatestVersion, upgradeToLatest } from "../backend/backend";
import { ActionButtonItem } from ".";
import { localizationManager, L } from "../i18n";

class VersionData {
  current: string;
  latest: string;
  constructor(current: string = "", latest: string = "") {
    this.current = current;
    this.latest = latest;
  }
}
export const VersionContext = createContext<VersionData>(
  new VersionData()
);

export const VersionComponent: FC = () => {
  const versionData = useContext(VersionContext);

  useEffect(() => {
    (async () => {
      const latestVersion = await getLatestVersion();
      versionData.latest = latestVersion;
    })();
  });

  let uptButtonText = localizationManager.getString(L.REINSTALL_PLUGIN);

  if (versionData.current !== versionData.latest && Boolean(versionData.latest)) {
    uptButtonText =
      localizationManager.getString(L.UPDATE_TO) + ` ${versionData.latest}`;
  }

  return (
    <PanelSection title={localizationManager.getString(L.VERSION)}>
      <PanelSectionRow>
        <ActionButtonItem
          layout="below"
          onClick={async () => {
            await upgradeToLatest();
          }}
        >
          {uptButtonText}
        </ActionButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <Field
          focusable
          label={localizationManager.getString(L.INSTALLED_VERSION)}
        >
          {versionData.current}
        </Field>
      </PanelSectionRow>
      {Boolean(versionData.latest) && (
        <PanelSectionRow>
          <Field
            focusable
            label={localizationManager.getString(L.LATEST_VERSION)}
          >
            {versionData.latest}
          </Field>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
};
