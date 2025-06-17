import { FC, useLayoutEffect, useState } from "react";
import { Field, Navigation, PanelSection } from "@decky/ui";
import { FiGithub } from "react-icons/fi";
import { localizationManager, L } from "../i18n";
import * as backend from "../backend/backend";

export const About: FC = () => {
  const [version, setVersion] = useState<string>();
  const [coreVersion, setCoreVersion] = useState<string>();

  useLayoutEffect(() => {
    backend.getVersion().then((x) => {
      setVersion(x);
    });
    backend.getVersionCore().then((x) => {
      setCoreVersion(x);
    });
  }, []);
  return (
    // The outermost div is to push the content down into the visible area
    <>
      <PanelSection>
        <h2
          style={{ fontWeight: "bold", fontSize: "1.5em", marginBottom: "0px" }}
        >
          DeckyClash
        </h2>
        <p>
          Light-weight Clash/Mihomo proxy client for Steam OS.
        </p>
        <Field
          label={localizationManager.getString(L.INSTALLED_VERSION)}
        >
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
        <h2
          style={{ fontWeight: "bold", fontSize: "1.5em", marginBottom: "0px" }}
        >
          Mihomo
        </h2>
        <p>
          Another Clash Kernel.
          <br />
          <i>DeckyClash is powered by Mihomo.</i>
        </p>
        <Field
          label={localizationManager.getString(L.INSTALLED_CORE_VERSION)}
        >
          {coreVersion}
        </Field>
        <Field
          icon={<FiGithub style={{ display: "block" }} />}
          label="MetaCubeX/mihomo"
          onClick={() => {
            Navigation.NavigateToExternalWeb(
              "https://github.com/MetaCubeX/mihomo"
            );
          }}
        >
          GitHub Repo
        </Field>

      </PanelSection>
      <PanelSection title={localizationManager.getString(L.ACKNOWLEDGE)}>
        <h2
          style={{ fontWeight: "bold", fontSize: "1.5em", marginBottom: "0px" }}
        >
          To Moon
        </h2>
        <p>
          A network toolbox for SteamOS.
          <br />
          <i>DeckyClash is inspired by To Moon.</i>
        </p>
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

      </PanelSection>
    </>
  );
};
