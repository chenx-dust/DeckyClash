import { FC, useLayoutEffect, useState } from "react";
import { DialogBody, DialogControlsSection, DialogControlsSectionHeader, Field, Navigation } from "@decky/ui";
import { FiGithub } from "react-icons/fi";
import { t } from 'i18next';
import { L } from "../i18n";
import { backend, ResourceType } from "../backend";
import { DescriptionField } from "../components";

export const About: FC = () => {
  const [version, setVersion] = useState<string>();
  const [coreVersion, setCoreVersion] = useState<string>();

  useLayoutEffect(() => {
    backend.getVersion(ResourceType.PLUGIN).then((x) => {
      setVersion(x);
    });
    backend.getVersion(ResourceType.CORE).then((x) => {
      setCoreVersion(x);
    });
  }, []);
  return (
    // The outermost div is to push the content down into the visible area
    <DialogBody>
      <DialogControlsSection>
        <DescriptionField label="Decky Clash">
          Light-weight Clash/Mihomo proxy client for Steam OS.
        </DescriptionField>
        <Field
          label={t(L.INSTALLED_VERSION)} focusable >
          {version}
        </Field>
        <Field
          icon={<FiGithub style={{ display: "block" }} />}
          label="chenx-dust/DeckyClash"
          onClick={() => {
            Navigation.NavigateToExternalWeb(
              "https://github.com/chenx-dust/DeckyClash"
            );
          }}
        >
          GitHub Repo
        </Field>

      </DialogControlsSection>
      <DialogControlsSection>
        <DialogControlsSectionHeader>
          {t(L.DEPENDENCY)}
        </DialogControlsSectionHeader>
        <DescriptionField label="Mihomo">
          Another Mihomo Kernel.
          <br />
          <i>Decky Clash is powered by Mihomo.</i>
        </DescriptionField>
        <Field
          label={t(L.INSTALLED_VERSION)}
          focusable={true}
        >
          {coreVersion}
        </Field>
        <Field
          icon={<FiGithub style={{ display: "block" }} />}
          label="MetaCubeX/mihomo"
          onClick={() => {
            Navigation.NavigateToExternalWeb(
              "https://github.com/MetaCubeX/mihomo/tree/Meta"
            );
          }}
        >
          GitHub Repo
        </Field>
      </DialogControlsSection>
    </DialogBody>
  );
};
