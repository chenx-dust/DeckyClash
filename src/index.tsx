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
} from "@decky/ui";
import {
  addEventListener,
  removeEventListener,
  definePlugin,
  routerHook,
  toaster
} from "@decky/api"
import { FC, useEffect, useLayoutEffect, useState } from "react";
import { GiCat } from "react-icons/gi";

import { Subscriptions, About } from "./pages";

import * as backend from "./backend/backend";

import { Config, EnhancedMode } from "./backend";
import { ActionButtonItem, VersionComponent } from "./components";
import { localizationManager, L } from "./i18n";
import { QRCodeCanvas } from "qrcode.react";

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

  const [clashState, setClashState] = useState(localConfig.status);
  const [clashStateChanging, setClashStateChanging] = useState(false);
  const [subOptions, setSubOptions] = useState<DropdownOption[]>(parseSubOptions(localSubscriptions));
  const [clashStateTips, setClashStateTips] = useState(
    localConfig.status ?
      localizationManager.getString(L.ENABLE_CLASH_IS_RUNNING) :
      localizationManager.getString(L.ENABLE_CLASH_DESC)
  );
  const [currentSub, setCurrentSub] = useState<string | null>(localConfig.current);
  const [overrideDNS, setOverrideDNS] = useState(localConfig.override_dns);
  const [enhancedMode, setEnhancedMode] = useState<EnhancedMode>(localConfig.enhanced_mode);
  const [currentDashboard, setCurrentDashboard] = useState<string | null>(localConfig.dashboard);
  const [dashboardOptions, setDashboardOption] = useState<DropdownOption[]>(parseDashboardOptions(localDashboards));
  const [allowRemoteAccess, setAllowRemoteAccess] = useState(localConfig.allow_remote_access);
  const [controllerPort, setControllerPort] = useState(localConfig.controller_port);
  const [secret, setSecret] = useState<string>(localConfig.secret);
  const [initialized, setInitialized] = useState(false);
  const [qrPageUrl, setQRPageUrl] = useState<string>();
  const [currentIP, setCurrentIP] = useState<string>(localIP);

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

  // 批量设置配置
  const applyConfig = (config: Config, save: boolean = true) => {
    if (save) {
      window.localStorage.setItem("decky-clash-config", JSON.stringify(config));
    }
    setClashStateTips(
      config.status ?
        localizationManager.getString(L.ENABLE_CLASH_IS_RUNNING) :
        localizationManager.getString(L.ENABLE_CLASH_DESC)
    );
    setClashState(config.status);
    setCurrentSub(config.current);
    setSecret(config.secret);
    setOverrideDNS(config.override_dns);
    setEnhancedMode(config.enhanced_mode);
    setAllowRemoteAccess(config.allow_remote_access);
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

  const fetchAllConfig = () => {
    fetchConfig();
    fetchSubscriptions();
    fetchDashboards();
    fetchIP();
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
    };
  }

  useEffect(() => {
    // 主动保存
    if (initialized) {
      window.localStorage.setItem("decky-clash-config", JSON.stringify(getCurrentConfig()));
    }
  }, [initialized, clashState, currentSub, overrideDNS, enhancedMode, allowRemoteAccess, currentDashboard])

  useLayoutEffect(fetchAllConfig, []);

  useEffect(() => {
    // 内核退出回调
    const callback = (code: number) => {
      setClashState(false);
      setClashStateTips(
        localizationManager.getString(L.ENABLE_CLASH_FAILED) + " Code " + code
      );
    }
    addEventListener("core_exit", callback);
    return () => {
      removeEventListener("core_exit", callback);
    };
  }, []);

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
        title: localizationManager.getString(L.RESTART_CORE),
        body: localizationManager.getString(L.ENABLE_CLASH_FAILED),
        icon: <GiCat />,
      })
    }
  }

  useEffect(() => {
    // 自动重载
    const timer = setTimeout(() => {
      restartClash();
    }, 1000);
    setClashState((s) => {
      // 如果没开启则停止重载
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

  return (
    <div>
      <PanelSection title={localizationManager.getString(L.SERVICE)}>
        <PanelSectionRow>
          <ToggleField
            label={localizationManager.getString(L.ENABLE_CLASH)}
            description={clashStateTips}
            checked={clashState}
            disabled={clashStateChanging}
            onChange={async (value: boolean) => {
              setClashState(value);
              setClashStateChanging(true);
              setClashStateTips(
                value ?
                  localizationManager.getString(L.ENABLE_CLASH_LOADING) :
                  localizationManager.getString(L.ENABLE_CLASH_DESC)
              );
              const [success, reason] = await backend.setCoreStatus(value);
              setClashStateChanging(false);
              if (!success) {
                setClashState(false);
                toaster.toast({
                  title: localizationManager.getString(L.ENABLE_CLASH_FAILED),
                  body: reason,
                  icon: <GiCat />,
                });
                setClashStateTips(
                  localizationManager.getString(L.ENABLE_CLASH_FAILED) + " Err: " + reason
                );
              } else {
                setClashStateTips(
                  value ?
                    localizationManager.getString(L.ENABLE_CLASH_IS_RUNNING) :
                    localizationManager.getString(L.ENABLE_CLASH_DESC)
                );
              }
              backend.getCoreStatus().then(setClashState);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            label={localizationManager.getString(L.SELECT_SUBSCRIPTION)}
            strDefaultLabel={localizationManager.getString(
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
          <ButtonItem
            layout="below"
            onClick={() => {
              Router.CloseSideMenus();
              Router.Navigate("/clash-config");
            }}
          >
            {localizationManager.getString(L.MANAGE_SUBSCRIPTIONS)}
          </ButtonItem>
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
            {localizationManager.getString(L.OPEN_DASHBOARD)}
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            label={localizationManager.getString(L.SELECT_DASHBOARD)}
            strDefaultLabel={localizationManager.getString(L.SELECT_DASHBOARD)}
            rgOptions={dashboardOptions}
            selectedOption={currentDashboard}
            onMenuWillOpen={fetchDashboards}
            disabled={clashStateChanging}
            onChange={(value) => {
              setCurrentDashboard(value.data);
              patchLocalConfig("dashboard", value.data);
              backend.setConfigValue("dashboard", value.data);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label={localizationManager.getString(L.ALLOW_REMOTE_ACCESS)}
            description=
            {allowRemoteAccess && clashState && !clashStateChanging && qrPageUrl && (
              <div style={{ overflowWrap: "break-word" }}>
                <QRCodeCanvas style={{
                  display: "block",
                  margin: "8px auto",
                }} value={qrPageUrl} size={128} />
                {qrPageUrl}
              </div>
            ) || localizationManager.getString(L.ALLOW_REMOTE_ACCESS_DESC) }
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
            label={localizationManager.getString(L.OVERRIDE_DNS)}
            description={localizationManager.getString(L.OVERRIDE_DNS_DESC)}
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
              label={localizationManager.getString(L.ENHANCED_MODE)}
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
      </PanelSection>
      <PanelSection title={localizationManager.getString(L.TOOLS)}>
        <PanelSectionRow>
          <ActionButtonItem
            layout="below"
            onClick={fetchAllConfig}
          >
            {localizationManager.getString(L.RELOAD_CONFIG)}
          </ActionButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ActionButtonItem
            disabled={!clashState || clashStateChanging}
            layout="below"
            onClick={restartClash}
          >
            {localizationManager.getString(L.RESTART_CORE)}
          </ActionButtonItem>
        </PanelSectionRow>
      </PanelSection>

      <VersionComponent />
    </div>
  );
};

const DeckyPluginRouter: FC = () => {
  addEventListener("core_exit", (code: number) => {
    if (code != 0) {
      toaster.toast({
        title: localizationManager.getString(L.CLASH_EXIT_TITLE),
        body: "Code: " + code,
        icon: <GiCat />,
      });
    }
  });
  return (
    <SidebarNavigation
      title="DeckyClash"
      showTitle
      pages={[
        {
          title: localizationManager.getString(L.SUBSCRIPTIONS),
          content: <Subscriptions Subscriptions={subscriptions} />,
          route: "/clash-config/subscriptions",
        },
        {
          title: localizationManager.getString(L.ABOUT),
          content: <About />,
          route: "/clash-config/about",
        },
      ]}
    />
  );
};

export default definePlugin(() => {
  localizationManager.init();
  routerHook.addRoute("/clash-config", DeckyPluginRouter);
  patchLocalConfig("status", false);

  return {
    // The name shown in various decky menus
    name: "DeckyClash",
    // The element displayed at the top of your plugin's menu
    titleView: <div className={staticClasses.Title}>DeckyClash</div>,
    // The content of your plugin's menu
    content: <Content />,
    // The icon displayed in the plugin list
    icon: <GiCat />,
    // The function triggered when your plugin unloads
    onDismount() {
      patchLocalConfig("status", false);
    },
  };
});
