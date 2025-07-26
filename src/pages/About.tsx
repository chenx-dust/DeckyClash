import { FC, useLayoutEffect, useState } from "react";
import { DialogBody, DialogControlsSection, DialogControlsSectionHeader, Field, Navigation } from "@decky/ui";
import { FiGithub } from "react-icons/fi";
import { t } from 'i18next';
import { L } from "../i18n";
import { backend } from "../backend";
import { DescriptionField } from "../components";

export const About: FC = () => {
  const [version, setVersion] = useState<string>();
  const [coreVersion, setCoreVersion] = useState<string>();
  const [yqVersion, setYqVersion] = useState<string>();

  useLayoutEffect(() => {
    backend.getVersion().then((x) => {
      setVersion(x);
    });
    backend.getVersionCore().then((x) => {
      setCoreVersion(x);
    });
    backend.getVersionYq().then((x) => {
      setYqVersion(x);
    });
  }, []);
  return (
    // The outermost div is to push the content down into the visible area
    <DialogBody>
      <DialogControlsSection>
        <DescriptionField label="DeckyClash">
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
          <i>DeckyClash is powered by Mihomo.</i>
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

        <DescriptionField label="YQ">
          A portable command-line YAML, JSON, XML, CSV, TOML and properties processor.
          <br />
          <i>DeckyClash uses yq as its YAML processor.</i>
        </DescriptionField>
        <Field label={t(L.INSTALLED_VERSION)} focusable >
          {yqVersion}
        </Field>
        <Field
          icon={<FiGithub style={{ display: "block" }} />}
          label="mikefarah/yq"
          onClick={() => {
            Navigation.NavigateToExternalWeb(
              "https://github.com/mikefarah/yq"
            );
          }}
        >
          GitHub Repo
        </Field>

      </DialogControlsSection>
      <DialogControlsSection>
        <DialogControlsSectionHeader>
          {t(L.ACKNOWLEDGE)}
        </DialogControlsSectionHeader>
        <DescriptionField label="To Moon">
          A network toolbox for SteamOS.
          <br />
          <i>DeckyClash is inspired by To Moon.</i>
        </DescriptionField>
        <Field
          icon={<FiGithub style={{ display: "block" }} />}
          label="YukiCoco/ToMoon"
          onClick={() => {
            Navigation.NavigateToExternalWeb(
              "https://github.com/YukiCoco/ToMoon"
            );
          }}
        >
          GitHub Repo
        </Field>

      </DialogControlsSection>
    </DialogBody>
  );
};
