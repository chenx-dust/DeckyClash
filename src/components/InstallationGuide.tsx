import { Field, PanelSection, PanelSectionRow, Spinner } from "@decky/ui";
import { FC, useState } from "react";
import { FaCheck, FaEllipsisH, FaRedoAlt, FaTimes } from "react-icons/fa";
import { DoubleButton } from "./DoubleButton";
import { ActionButtonItem } from "./ActionButtonItem";
import { backend, ResourceType } from "../backend";
import { t } from 'i18next';
import { L } from "../i18n";
import { toaster } from "@decky/api";
import { GiCat } from "react-icons/gi";

export interface InstallationGuideProps {
  coreVersion: string;
  yqVersion: string;
  refreshCallback: () => any;
  quitCallback: () => any;
}

export const InstallationGuide: FC<InstallationGuideProps> = (props) => {
  const [coreInstalling, setCoreInstalling] = useState(false);
  const [yqInstalling, setYqInstalling] = useState(false);
  const [geosInstalling, setGeosInstalling] = useState(false);
  const [geosInstalled, setGeosInstalled] = useState(false);
  const [dashboardsInstalling, setDashboardsInstalling] = useState(false);
  const [dashboardsInstalled, setDashboardsInstalled] = useState(false);

  const installCore = async () => {
    setCoreInstalling(true);
    const [success, error] =
      await backend.upgrade(ResourceType.CORE, await backend.getLatestVersion(ResourceType.CORE));
    setCoreInstalling(false);
    if (!success)
      toaster.toast({
        title: t(L.INSTALL_FAILURE),
        body: `Mihomo: ${error}`,
        icon: <GiCat />,
      });
  };

  const installYQ = async () => {
    setYqInstalling(true);
    const [success, error] =
      await backend.upgrade(ResourceType.YQ, await backend.getLatestVersion(ResourceType.YQ));
    setYqInstalling(false);
    if (!success)
      toaster.toast({
        title: t(L.INSTALL_FAILURE),
        body: `yq: ${error}`,
        icon: <GiCat />,
      });
  };

  const installGeos = async () => {
    setGeosInstalling(true);
    const [success, error] = await backend.installGeos();
    setGeosInstalling(false);
    setGeosInstalled(success);
    if (!success)
      toaster.toast({
        title: t(L.INSTALL_FAILURE),
        body: `Geo-files: ${error}`,
        icon: <GiCat />,
      });
  };

  const installDashboards = async () => {
    setDashboardsInstalling(true);
    const [success, error] = await backend.installDashboards();
    setDashboardsInstalling(false);
    setDashboardsInstalled(success);
    if (!success)
      toaster.toast({
        title: t(L.INSTALL_FAILURE),
        body: `Dashboards: ${error}`,
        icon: <GiCat />,
      });
  };

  const installAll = async () => {
    let promises = [];
    if (props.coreVersion === "" && !coreInstalling)
      promises.push(installCore());
    if (props.yqVersion === "" && !yqInstalling)
      promises.push(installCore());
    if (!geosInstalling && !geosInstalled)
      promises.push(installGeos());
    if (!dashboardsInstalling && !dashboardsInstalled)
      promises.push(installDashboards());
    await Promise.all(promises);
    props.refreshCallback();
  };

  return (
    <PanelSection title={t(L.INSTALLATION_GUIDE)}>
      <div style={{ margin: '4px 0' }}>
        {t(L.INSTALLATION_MSG)}
      </div>
      <PanelSectionRow>
        <Field
          label="Mihomo"
          onClick={() => installCore().then(props.refreshCallback)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {coreInstalling ? (<Spinner style={{ width: '1.1em' }} />) : (
                props.coreVersion === "" ? (<FaTimes />) :
                  (<>{props.coreVersion} <FaCheck /></>)
            )}
          </div>
        </Field>
      </PanelSectionRow>
      <PanelSectionRow>
        <Field
          label="yq"
          onClick={() => installYQ().then(props.refreshCallback)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {yqInstalling ? (<Spinner style={{ width: '1.1em' }} />) : (
              props.yqVersion === "" ? (<FaTimes />) :
                (<>{props.yqVersion} <FaCheck /></>)
            )}
          </div>
        </Field>
      </PanelSectionRow>
      <PanelSectionRow>
        <Field
          label={t(L.INSTALLATION_GEO)}
          onClick={installGeos}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {geosInstalling ? (<Spinner style={{ width: '1.1em' }} />) : (geosInstalled ? <FaCheck /> : <FaEllipsisH />)}
          </div>
        </Field>
      </PanelSectionRow>
      <PanelSectionRow>
        <Field
          label={t(L.INSTALLATION_DASHBOARD)}
          onClick={installDashboards}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {dashboardsInstalling ? (<Spinner style={{ width: '1.1em' }} />) : (dashboardsInstalled ? <FaCheck /> : <FaEllipsisH />)}
          </div>
        </Field>
      </PanelSectionRow>
      <PanelSectionRow>
        <DoubleButton
          largeProps={{
            children: t(L.INSTALLATION_ALL),
            onClick: installAll,
          }}
          smallProps={{
            children: <FaRedoAlt />,
            onClick: props.refreshCallback,
          }}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <ActionButtonItem onClick={props.quitCallback}>
          {props.coreVersion !== "" && props.yqVersion !== "" &&
            t(L.INSTALLATION_FINISH) ||
            t(L.INSTALLATION_SKIP)
          }
        </ActionButtonItem>
      </PanelSectionRow>
    </PanelSection>
  );
};
