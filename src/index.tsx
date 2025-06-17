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

let subscriptions: Record<string, string> = {};

const Content: FC<{}> = ({}) => {
  const [clashState, setClashState] = useState(false);
  const [clashStateChanging, setClashStateChanging] = useState(true);
  const [subOptions, setSubOptions] = useState<DropdownOption[]>([]);
  const [clashStateTips, setClashStateTips] = useState(
    localizationManager.getString(L.ENABLE_CLASH_DESC)
  );
  const [overrideDNS, setOverrideDNS] = useState(true);
  const [currentSub, setCurrentSub] = useState<string | null>(null);
  const [enhancedMode, setEnhancedMode] = useState<EnhancedMode>(EnhancedMode.FakeIp);
  const [currentDashboard, setCurrentDashboard] = useState<string | null>(null);
  const [dashboardOptions, setDashboardOption] = useState<DropdownOption[]>([]);
  const [allowRemoteAccess, setAllowRemoteAccess] = useState(false);
  const [secret, setSecret] = useState<string>("");
  const [controllerPort, setControllerPort] = useState(9090);


  const applySubscriptions = (subs: Record<string, string>, save: boolean = true) => {
    subscriptions = subs;
    if (save)
      window.localStorage.setItem("decky-clash-subscriptions", JSON.stringify(subs));
    let items: DropdownOption[] = [];
    for (const key in subs) {
      items.push({
        label: key,
        data: key,
      });
    }
    setSubOptions(items);
  }
  const fetchSubscriptions = async () => {
    const subs = await backend.getSubscriptionList();
    console.log(subs);
    applySubscriptions(subs);
  };

  const applyDashboards = (boards: string[], save: boolean = true) => {
    if (save)
      window.localStorage.setItem("decky-clash-dashboards", JSON.stringify(boards));
    let items: DropdownOption[] = [];
    for (const idx in boards) {
      items.push({
        label: boards[idx],
        data: boards[idx],
      });
    }
    setDashboardOption(items);
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
    setClashStateChanging(true);
    const config = await backend.getConfig();
    console.log(config);
    applyConfig(config);
    setClashStateChanging(false);
  };

  const fetchAllConfig = () => {
    fetchConfig();
    fetchSubscriptions();
    fetchDashboards();
  }

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
    if (!clashStateChanging) {
      window.localStorage.setItem("decky-clash-config", JSON.stringify(getCurrentConfig()));
    }
  }, [clashStateChanging, clashState, currentSub, overrideDNS, enhancedMode, allowRemoteAccess, currentDashboard])

  useLayoutEffect(() => {
    // 从 localStorage 恢复配置更快
    const localConfig = window.localStorage.getItem("decky-clash-config");
    if (localConfig) {
      const config = JSON.parse(localConfig);
      applyConfig(config, false);
    }
    const localSubscriptions = window.localStorage.getItem("decky-clash-subscriptions");
    if (localSubscriptions) {
      const subs = JSON.parse(localSubscriptions);
      applySubscriptions(subs, false);
    }
    const localDashboard = window.localStorage.getItem("decky-clash-dashboards");
    if (localDashboard) {
      const dashboard = JSON.parse(localDashboard);
      applyDashboards(dashboard, false);
    }

    // 从后端获取配置
    fetchAllConfig();
  }, []);

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
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            strDefaultLabel={localizationManager.getString(
              L.SELECT_SUBSCRIPTION
            )}
            rgOptions={subOptions}
            selectedOption={currentSub}
            onMenuWillOpen={fetchSubscriptions}
            disabled={clashStateChanging}
            onChange={async (x) => {
              setCurrentSub(x.data);
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
            disabled={clashStateChanging || !clashState || currentDashboard === null}
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
              backend.setConfigValue("dashboard", value.data);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label={localizationManager.getString(L.ALLOW_REMOTE_ACCESS)}
            description={localizationManager.getString(
              L.ALLOW_REMOTE_ACCESS_DESC
            )}
            checked={allowRemoteAccess}
            disabled={clashStateChanging}
            onChange={(value: boolean) => {
              setAllowRemoteAccess(value);
              backend.setConfigValue("allow_remote_access", value).then(restartClash);
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
              backend.setConfigValue("override_dns", value).then(restartClash);
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
                backend.setConfigValue("enhanced_mode", _enhancedMode.toString()).then(restartClash);
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
      console.log("Unloading")
    },
  };
});
