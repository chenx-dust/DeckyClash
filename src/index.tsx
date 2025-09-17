import {
  ButtonItem,
  PanelSection,
  PanelSectionRow,
  Router,
  staticClasses,
  ToggleField,
  SidebarNavigation,
  DropdownOption,
  Navigation,
  DropdownItem,
  SliderField,
  NotchLabel,
  Field,
} from "@decky/ui";
import {
  addEventListener,
  removeEventListener,
  definePlugin,
  routerHook,
  toaster
} from "@decky/api";

import { FC, useEffect, useLayoutEffect, useState } from "react";
import { t } from 'i18next';
import { QRCodeCanvas } from "qrcode.react";

import { About, Import, Manage, Upgrade } from "./pages";
import { backend, Config, EnhancedMode, ResourceType } from "./backend";
import { ActionButtonItem, DoubleButton, InstallationGuide } from "./components";
import { localizationManager, L } from "./i18n";
import { DeckyClashIcon, TIPS_TIMEOUT } from "./global";
import { FaPlus } from "react-icons/fa";

let subscriptions: Record<string, string> = {};

const patchLocalConfig = (key: string, data: any) => {
  const config = JSON.parse(window.localStorage.getItem("decky-clash-config") || "{}");
  config[key] = data;
  window.localStorage.setItem("decky-clash-config", JSON.stringify(config));
}

const Content: FC<{}> = ({ }) => {
  const localConfig: Config = JSON.parse(window.localStorage.getItem("decky-clash-config") || "{}");
  const localSubscriptions: Record<string, string> = JSON.parse(window.localStorage.getItem("decky-clash-subscriptions") || "{}");
  const localDashboards: string[] = JSON.parse(window.localStorage.getItem("decky-clash-dashboards") || "[]");
  const localIP = window.localStorage.getItem("decky-clash-ip") || "";

  const parseSubOptions = (subs: Record<string, string>) => {
    let items: DropdownOption[] = [];
    for (const key in subs) {
      items.push({
        label: key,
        data: key,
      });
    }
    return items;
  };

  const parseDashboardOptions = (boards: string[]) => {
    const items: DropdownOption[] = [];
    for (const idx in boards) {
      items.push({
        label: boards[idx],
        data: boards[idx],
      });
    }
    return items;
  };

  const [installGuide, setInstallGuide] = useState(false);
  const [pluginVersion, setPluginVersion] = useState("");
  const [coreVersion, setCoreVersion] = useState("");
  const [yqVersion, setYqVersion] = useState("");
  const [clashState, setClashState] = useState(localConfig.status);
  const [clashStateChanging, setClashStateChanging] = useState(false);
  const [subOptions, setSubOptions] = useState<DropdownOption[]>(parseSubOptions(localSubscriptions));
  const [clashStateTips, setClashStateTips] = useState(
    localConfig.status ?
      t(L.ENABLE_CLASH_IS_RUNNING) :
      t(L.ENABLE_CLASH_DESC)
  );
  const [currentSub, setCurrentSub] = useState<string | null>(localConfig.current);
  const [overrideDNS, setOverrideDNS] = useState(localConfig.override_dns);
  const [enhancedMode, setEnhancedMode] = useState<EnhancedMode>(localConfig.enhanced_mode);
  const [autostart, setAutostart] = useState(localConfig.autostart);
  const [skipSteamDownload, setSkipSteamDownload] = useState(localConfig.skip_steam_download);
  const [currentDashboard, setCurrentDashboard] = useState<string | null>(localConfig.dashboard);
  const [dashboardOptions, setDashboardOption] = useState<DropdownOption[]>(parseDashboardOptions(localDashboards));
  const [allowRemoteAccess, setAllowRemoteAccess] = useState(localConfig.allow_remote_access);
  const [controllerPort, setControllerPort] = useState(localConfig.controller_port);
  const [secret, setSecret] = useState<string>(localConfig.secret);
  const [initialized, setInitialized] = useState(false);
  const [qrPageUrl, setQRPageUrl] = useState<string>();
  const [currentIP, setCurrentIP] = useState<string>(localIP);

  const refreshVersions = async () => {
    const _coreVersion = await backend.getVersion(ResourceType.CORE);
    const _yqVersion = await backend.getVersion(ResourceType.YQ);
    const _pluginVersion = await backend.getVersion(ResourceType.PLUGIN);
    setCoreVersion(_coreVersion);
    setYqVersion(_yqVersion);
    setPluginVersion(_pluginVersion);
    return [_coreVersion, _yqVersion];
  };

  useEffect(() => {
    refreshVersions().then(([_coreVersion, _yqVersion]) => {
      if (_coreVersion === "" || _yqVersion === "")
        setInstallGuide(true);
    });
  }, []);

  const applySubscriptions = (subs: Record<string, string>, save: boolean = true) => {
    subscriptions = subs;
    if (save)
      window.localStorage.setItem("decky-clash-subscriptions", JSON.stringify(subs));
    setSubOptions(parseSubOptions(subs));
  }
  const fetchSubscriptions = async () => {
    const subs = await backend.getSubscriptionList();
    console.log(subs);
    applySubscriptions(subs);
  };

  const applyDashboards = (boards: string[], save: boolean = true) => {
    if (save)
      window.localStorage.setItem("decky-clash-dashboards", JSON.stringify(boards));
    setDashboardOption(parseDashboardOptions(boards));
  };
  const fetchDashboards = async () => {
    const boards = await backend.getDashboardList();
    console.log(boards);
    applyDashboards(boards);
  };

  // batch applying config
  const applyConfig = (config: Config, save: boolean = true) => {
    if (save) {
      window.localStorage.setItem("decky-clash-config", JSON.stringify(config));
    }
    setClashStateTips(
      config.status ?
        t(L.ENABLE_CLASH_IS_RUNNING) :
        t(L.ENABLE_CLASH_DESC)
    );
    setClashState(config.status);
    setCurrentSub(config.current);
    setSecret(config.secret);
    setOverrideDNS(config.override_dns);
    setEnhancedMode(config.enhanced_mode);
    setAllowRemoteAccess(config.allow_remote_access);
    setAutostart(config.autostart);
    setSkipSteamDownload(config.skip_steam_download);
    setCurrentDashboard(config.dashboard);
    setControllerPort(config.controller_port);
  }

  const fetchConfig = async () => {
    setInitialized(false);
    const config = await backend.getConfig();
    console.log(config);
    applyConfig(config);
    setInitialized(true);
  };

  const fetchIP = async () => {
    const ip = await backend.getIP();
    console.log(ip);
    setCurrentIP(ip);
    window.localStorage.setItem("decky-clash-ip", ip);
  };

  const fetchAllConfig = async () => {
    await Promise.all([
      fetchConfig(),
      fetchSubscriptions(),
      fetchDashboards(),
      fetchIP(),
    ]);
  }

  useEffect(() => {
    if (currentIP && currentDashboard)
      setQRPageUrl(`http://${currentIP}:${controllerPort}/ui/${currentDashboard}/?hostname=${currentIP}&port=${controllerPort}&secret=${secret}`)
  },
    [currentIP, currentDashboard, controllerPort, secret]
  );

  const getCurrentConfig = (): Config => {
    return {
      status: clashState,
      current: currentSub,
      secret: secret,
      override_dns: overrideDNS,
      enhanced_mode: enhancedMode,
      allow_remote_access: allowRemoteAccess,
      dashboard: currentDashboard,
      controller_port: controllerPort,
      autostart: autostart,
      skip_steam_download: skipSteamDownload
    };
  }

  useEffect(() => {
    // actively save
    if (initialized) {
      window.localStorage.setItem("decky-clash-config", JSON.stringify(getCurrentConfig()));
    }
  }, [initialized, clashState, currentSub, overrideDNS, enhancedMode, allowRemoteAccess, currentDashboard])

  useLayoutEffect(() => { fetchAllConfig(); }, []);

  useEffect(() => {
    // core exit callback
    const callback = (code: number) => {
      setClashState(false);
      if (code != 0)
        setClashStateTips(
          t(L.ENABLE_CLASH_CRASH) + " Code " + code
        );
      else
        setClashStateTips(t(L.ENABLE_CLASH_DESC));
    }
    addEventListener("core_exit", callback);
    return () => {
      removeEventListener("core_exit", callback);
    };
  }, []);

  useEffect(() => {
    if (!clashState && clashStateTips != t(L.ENABLE_CLASH_DESC)) {
      const timer = setTimeout(() => {
        setClashStateTips(t(L.ENABLE_CLASH_DESC));
      }, TIPS_TIMEOUT);
      return () => clearTimeout(timer);
    }
    return;
  }, [clashState, clashStateTips]);

  const enhancedModeOptions = [
    { mode: EnhancedMode.RedirHost, label: "Redir Host" },
    { mode: EnhancedMode.FakeIp, label: "Fake IP" },
  ];

  const enhancedModeNotchLabels: NotchLabel[] = enhancedModeOptions.map(
    (opt, i) => {
      return {
        notchIndex: i,
        label: opt.label,
        value: i,
      };
    }
  );

  const convertEnhancedMode = (value: number) => {
    return enhancedModeOptions[value].mode;
  };

  const convertEnhancedModeValue = (value: EnhancedMode) => {
    return enhancedModeOptions.findIndex((opt) => opt.mode === value);
  };

  const restartClash = async () => {
    if (!clashState)
      return;
    setClashStateChanging(true);
    const success = await backend.restartCore();
    setClashStateChanging(false);
    if (!success) {
      toaster.toast({
        title: t(L.RESTART_CORE),
        body: t(L.ENABLE_CLASH_FAILED),
        icon: <DeckyClashIcon />,
      });
    }
  }

  useEffect(() => {
    // auto reload with debounce
    const timer = setTimeout(() => {
      restartClash();
    }, 1000);
    setClashState((s) => {
      if (!s)
        clearTimeout(timer);
      return s;
    })
    setInitialized((s) => {
      if (!s)
        clearTimeout(timer);
      return s;
    })
    return () => clearTimeout(timer);
  }, [overrideDNS, enhancedMode, allowRemoteAccess])

  return (installGuide ?
    <InstallationGuide
      coreVersion={coreVersion}
      yqVersion={yqVersion}
      refreshCallback={refreshVersions}
      quitCallback={() => setInstallGuide(false)}
    />
    :
    <>
      <PanelSection title={t(L.SERVICE)}>
        <PanelSectionRow>
          <ToggleField
            label={t(L.ENABLE_CLASH)}
            description={clashStateTips}
            checked={clashState}
            disabled={clashStateChanging}
            onChange={async (value: boolean) => {
              setClashState(value);
              setClashStateChanging(true);
              setClashStateTips(
                value ?
                  t(L.ENABLE_CLASH_LOADING) :
                  t(L.ENABLE_CLASH_DESC)
              );
              const [success, error] = await backend.setCoreStatus(value);
              setClashStateChanging(false);
              if (!success) {
                setClashState(false);
                toaster.toast({
                  title: t(L.ENABLE_CLASH_FAILED),
                  body: error,
                  icon: <DeckyClashIcon />,
                });
                setClashStateTips(
                  t(L.ENABLE_CLASH_FAILED) + " Err: " + error
                );
              } else {
                setClashStateTips(
                  value ?
                    t(L.ENABLE_CLASH_IS_RUNNING) :
                    t(L.ENABLE_CLASH_DESC)
                );
              }
              backend.getCoreStatus().then(setClashState);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            label={t(L.SELECT_SUBSCRIPTION)}
            strDefaultLabel={t(
              L.SELECT_SUBSCRIPTION
            )}
            rgOptions={subOptions}
            selectedOption={currentSub}
            onMenuWillOpen={fetchSubscriptions}
            disabled={clashStateChanging}
            onChange={async (x) => {
              setCurrentSub(x.data);
              patchLocalConfig("current", x.data);
              const success = await backend.setCurrent(x.data);
              if (!success)
                setCurrentSub(null);
              else
                restartClash();
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <DoubleButton
            largeProps={{
              children: t(L.MANAGE_SUBSCRIPTIONS),
              onClick: () => {
                Router.CloseSideMenus();
                Router.Navigate("/decky-clash/manage");
              }
            }}
            smallProps={{
              children: <FaPlus />,
              onClick: () => {
                Router.CloseSideMenus();
                Router.Navigate("/decky-clash/import");
              }
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            label={t(L.SELECT_DASHBOARD)}
            strDefaultLabel={t(L.SELECT_DASHBOARD)}
            rgOptions={dashboardOptions}
            selectedOption={currentDashboard}
            onMenuWillOpen={fetchDashboards}
            disabled={clashStateChanging}
            onChange={(value) => {
              setCurrentDashboard(value.data);
              patchLocalConfig("dashboard", value.data);
              backend.setConfigValue("dashboard", value.data);
              backend.restartCore();
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => {
              Router.CloseSideMenus();
              Navigation.NavigateToExternalWeb(
                `http://127.0.0.1:${controllerPort}/ui/${currentDashboard}/?hostname=127.0.0.1&port=${controllerPort}&secret=${secret}`
              );
            }}
            disabled={clashStateChanging || !clashState || !currentDashboard}
          >
            {t(L.OPEN_DASHBOARD)}
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label={t(L.ALLOW_REMOTE_ACCESS)}
            description=
            {(allowRemoteAccess && clashState && !clashStateChanging && qrPageUrl) ? (
              <div style={{ overflowWrap: "break-word" }}>
                <QRCodeCanvas style={{
                  display: "block",
                  margin: "8px auto",
                }} value={qrPageUrl} size={128} />
                {qrPageUrl}
              </div>
            ) : t(L.ALLOW_REMOTE_ACCESS_DESC) }
            checked={allowRemoteAccess}
            disabled={clashStateChanging}
            onChange={(value: boolean) => {
              setAllowRemoteAccess(value);
              backend.setConfigValue("allow_remote_access", value).then(() =>
                backend.getConfigValue("allow_remote_access").then(setAllowRemoteAccess));
              fetchIP();
            }}
          ></ToggleField>
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label={t(L.OVERRIDE_DNS)}
            description={t(L.OVERRIDE_DNS_DESC)}
            checked={overrideDNS}
            disabled={clashStateChanging}
            onChange={(value: boolean) => {
              setOverrideDNS(value);
              backend.setConfigValue("override_dns", value).then(() =>
                backend.getConfigValue("override_dns").then(setOverrideDNS));
            }}
          ></ToggleField>
        </PanelSectionRow>
        {overrideDNS && (
          <PanelSectionRow>
            <SliderField
              label={t(L.ENHANCED_MODE)}
              value={convertEnhancedModeValue(enhancedMode)}
              min={0}
              max={enhancedModeNotchLabels.length - 1}
              notchCount={enhancedModeNotchLabels.length}
              notchLabels={enhancedModeNotchLabels}
              notchTicksVisible={true}
              step={1}
              disabled={clashStateChanging}
              onChange={(value: number) => {
                const _enhancedMode = convertEnhancedMode(value);
                setEnhancedMode(_enhancedMode);
                backend.setConfigValue("enhanced_mode", _enhancedMode.toString()).then(() =>
                  backend.getConfigValue("enhanced_mode").then(setEnhancedMode));
              }}
            />
          </PanelSectionRow>
        )}
        <PanelSectionRow>
          <ToggleField
            label={t(L.AUTOSTART)}
            description={t(L.AUTOSTART_DESC)}
            checked={autostart}
            onChange={(value: boolean) => {
              setAutostart(value);
              backend.setConfigValue("autostart", value).then(() =>
                backend.getConfigValue("autostart").then(setAutostart));
            }}
          ></ToggleField>
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label={t(L.SKIP_STEAM)}
            description={t(L.SKIP_STEAM_DESC)}
            checked={skipSteamDownload}
            onChange={(value: boolean) => {
              setSkipSteamDownload(value);
              backend.setConfigValue("skip_steam_download", value).then(() =>
                backend.getConfigValue("skip_steam_download").then(setSkipSteamDownload));
            }}
          ></ToggleField>
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title={t(L.TOOLS)}>
        <PanelSectionRow>
          <ActionButtonItem
            layout="below"
            onClick={fetchAllConfig}
          >
            {t(L.RELOAD_CONFIG)}
          </ActionButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ActionButtonItem
            disabled={!clashState || clashStateChanging}
            layout="below"
            onClick={restartClash}
          >
            {t(L.RESTART_CORE)}
          </ActionButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => setInstallGuide(true)}
          >
            {t(L.INSTALLATION_GUIDE)}
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title={t(L.VERSION)}>
        <PanelSectionRow>
          <Field
            focusable
            label={t(L.PLUGIN)}
          >
            {pluginVersion}
          </Field>
        </PanelSectionRow>
        <PanelSectionRow>
          <Field
            focusable
            label="Mihomo"
          >
            {coreVersion}
          </Field>
        </PanelSectionRow>
        <PanelSectionRow>
          <Field
            focusable
            label="YQ"
          >
            {yqVersion}
          </Field>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => {
              Router.CloseSideMenus();
              Router.Navigate("/decky-clash/upgrade");
            }}
          >
            {t(L.UPGRADE_MANAGE)}
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => {
              Router.CloseSideMenus();
              Router.Navigate("/decky-clash/about");
            }}
          >
            {t(L.ABOUT_PLUGIN)}
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    </>
  );
};

const DeckyPluginRouter: FC = () => {
  return (
    <SidebarNavigation
      title="Decky Clash"
      showTitle
      pages={[
        {
          title: t(L.MANAGE),
          content: <Manage Subscriptions={subscriptions} />,
          route: "/decky-clash/manage",
        },
        {
          title: t(L.IMPORT),
          content: <Import />,
          route: "/decky-clash/import",
        },
        {
          title: t(L.UPGRADE),
          content: <Upgrade />,
          route: "/decky-clash/upgrade",
        },
        {
          title: t(L.ABOUT),
          content: <About />,
          route: "/decky-clash/about",
        },
      ]}
    />
  );
};

export default definePlugin(() => {
  localizationManager.init();
  routerHook.addRoute("/decky-clash", DeckyPluginRouter);
  patchLocalConfig("status", false);

  addEventListener("core_exit", (code: number) => {
    if (code != 0) {
      toaster.toast({
        title: t(L.CLASH_EXIT_TITLE),
        body: "Code: " + code,
        icon: <DeckyClashIcon />,
      });
    }
  });
  addEventListener("sub_update", (name: string) => {
    toaster.toast({
      title: t(L.DOWNLOAD_SUCCESS),
      body: name,
      icon: <DeckyClashIcon />,
    });
  });
  addEventListener("upgrade_notice", (msg: string) => {
    toaster.toast({
      title: t(L.UPGRADE_AVAILABLE),
      body: msg,
      icon: <DeckyClashIcon />,
      onClick: () => {
        Router.CloseSideMenus();
        Router.Navigate("/decky-clash/upgrade");
      },
    });
  });

  if ((window.localStorage.getItem("decky-clash-auto-check-update") || "true") === "true")
    setTimeout(backend.checkUpdate, 5000);

  return {
    // The name shown in various decky menus
    name: "Decky Clash",
    // The element displayed at the top of your plugin's menu
    titleView: <div className={staticClasses.Title}>Decky Clash</div>,
    // The content of your plugin's menu
    content: <Content />,
    // The icon displayed in the plugin list
    icon: <DeckyClashIcon />,
    // The function triggered when your plugin unloads
    onDismount() {
      patchLocalConfig("status", false);
    },
  };
});
