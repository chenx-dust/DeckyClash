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
let ignoreSaving = true;

const Content: FC<{}> = ({}) => {
  const [clashState, setClashState] = useState(false);
  const [clashStateChanging, setClashStateChanging] = useState(false);
  const [subOptions, setSubOptions] = useState<DropdownOption[]>([]);
  const [selectionTips, setSelectionTips] = useState(
    localizationManager.getString(L.ENABLE_CLASH_DESC)
  );
  const [overrideDNS, setOverrideDNS] = useState(true);
  const [currentSub, setCurrentSub] = useState<string | null>(null);
  const [enhancedMode, setEnhancedMode] = useState<EnhancedMode>(EnhancedMode.FakeIp);
  const [currentDashboard, setCurrentDashboard] = useState<string | null>(null);
  const [dashboardOptions, setDashboardOption] = useState<DropdownOption[]>([]);
  const [allowRemoteAccess, setAllowRemoteAccess] = useState(false);
  const [secret, setSecret] = useState<string>("");


  const setSubscriptions = (subs: Record<string, string>, save: boolean = true) => {
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
  const updateSubscriptions = async () => {
    const subs = await backend.getSubscriptionList();
    console.log(subs);
    setSubscriptions(subs);
  };

  const setDashboards = (boards: string[], save: boolean = true) => {
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
  const updateDashboards = async () => {
    const boards = await backend.getDashboardList();
    console.log(boards);
    setDashboards(boards);
  };

  const setConfig = (config: Config, save: boolean = true) => {
    if (save) {
      console.trace("saving config with set", config);
      window.localStorage.setItem("decky-clash-config", JSON.stringify(config));
    }
    setSelectionTips(
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
  }

  const updateConfig = async () => {
    ignoreSaving = true;
    const config = await backend.getConfig();
    console.log(config);
    setConfig(config);
    ignoreSaving = false;
  };

  const reloadFullConfig = () => {
    updateConfig();
    updateSubscriptions();
    updateDashboards();
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
    };
  }

  useEffect(() => {
    if (!ignoreSaving) {
      console.trace("saving config", getCurrentConfig());
      window.localStorage.setItem("decky-clash-config", JSON.stringify(getCurrentConfig()));
    } else {
      console.trace("ignoring saving config");
    }
  }, [clashState, currentSub, overrideDNS, enhancedMode, allowRemoteAccess, currentDashboard])

  useLayoutEffect(() => {
    console.log("init load");
    const localConfig = window.localStorage.getItem("decky-clash-config");
    if (localConfig) {
      const config = JSON.parse(localConfig);
      setConfig(config, false);
    }
    const localSubscriptions = window.localStorage.getItem("decky-clash-subscriptions");
    if (localSubscriptions) {
      const subs = JSON.parse(localSubscriptions);
      setSubscriptions(subs, false);
    }
    const localDashboard = window.localStorage.getItem("decky-clash-dashboards");
    if (localDashboard) {
      const dashboard = JSON.parse(localDashboard);
      setDashboards(dashboard, false);
    }

    reloadFullConfig();
  }, []);

  useEffect(() => {
    const callback = (code: number) => {
      setClashState(false);
      setSelectionTips(
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

  return (
    <div>
      <PanelSection title={localizationManager.getString(L.SERVICE)}>
        <PanelSectionRow>
          <ToggleField
            label={localizationManager.getString(L.ENABLE_CLASH)}
            description={selectionTips}
            checked={clashState}
            disabled={clashStateChanging}
            onChange={async (value: boolean) => {
              setClashState(value);
              setClashStateChanging(true);
              setSelectionTips(
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
                setSelectionTips(
                  localizationManager.getString(L.ENABLE_CLASH_FAILED) + " Err: " + reason
                );
              } else {
                setSelectionTips(
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
            onMenuWillOpen={updateSubscriptions}
            onChange={async (x) => {
              setCurrentSub(x.data);
              const success = await backend.setCurrent(x.data);
              if (!success)
                setCurrentSub(null);
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
              let param = "";
              // let page = "setup";
              if (currentDashboard) {
                param = `/${currentDashboard}`;
                if (secret) {
                  // secret 不为空时，使用完整的参数，但是不同 dashboard 使用不同的 page
                  // switch (currentDashboard) {
                  //   case "metacubexd":
                  //   case "zashboard":
                  //     page = "setup";
                  //     break;
                  //   default:
                  //     page = "proxies";
                  //     break;
                  // }
                  param += `/?hostname=127.0.0.1&port=9090&secret=${secret}`;
                } else {
                  // 即使没有设置 secret，metacubexd 也会有奇怪的跳转问题，加上host和port
                  param += `/?hostname=127.0.0.1&port=9090`;
                }
              }
              Navigation.NavigateToExternalWeb(
                "http://127.0.0.1:9090/ui" + param
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
            onMenuWillOpen={updateDashboards}
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
            onChange={(value: boolean) => {
              setAllowRemoteAccess(value);
              backend.setConfigValue("allow_remote_access", value);
            }}
          ></ToggleField>
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label={localizationManager.getString(L.OVERRIDE_DNS)}
            description={localizationManager.getString(L.OVERRIDE_DNS_DESC)}
            checked={overrideDNS}
            onChange={(value: boolean) => {
              setOverrideDNS(value);
              backend.setConfigValue("override_dns", value);
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
              onChange={(value: number) => {
                const _enhancedMode = convertEnhancedMode(value);
                setEnhancedMode(_enhancedMode);
                backend.setConfigValue("enhanced_mode", _enhancedMode.toString());
              }}
            />
          </PanelSectionRow>
        )}
      </PanelSection>
      <PanelSection title={localizationManager.getString(L.TOOLS)}>
        <PanelSectionRow>
          <ActionButtonItem
            layout="below"
            onClick={reloadFullConfig}
          >
            {localizationManager.getString(L.RELOAD_CONFIG)}
          </ActionButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <ActionButtonItem
            disabled={!clashState || clashStateChanging}
            layout="below"
            onClick={() => {
              backend.restartCore();
            }}
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
      title="To Moon"
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
