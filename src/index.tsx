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
  definePlugin,
  routerHook
} from "@decky/api"
import { FC, useEffect, useState } from "react";
import { GiCat } from "react-icons/gi";

import { Subscriptions, About } from "./pages";

import * as backend from "./backend/backend";

import { EnhancedMode } from "./backend";
import { ActionButtonItem, VersionComponent } from "./components";
import { localizationManager, L } from "./i18n";

let shared_subs: Record<string, string> = {}

const Content: FC<{}> = ({}) => {
  const [clashState, setClashState] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
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
  const [secret, setSecret] = useState<string>();

  const updateSubscriptions = async () => {
    const subs = await backend.getSubscriptionList();
    shared_subs = subs;

    let items: DropdownOption[] = [];

    for (const key in subs) {
      items.push({
        label: key,
        data: key,
      });
    }
    setSubOptions(items);
  };
  const updateDashboards = async () => {
    const boards = await backend.getDashboardList();
    let items: DropdownOption[] = [];

    for (const idx in boards) {
      items.push({
        label: boards[idx],
        data: boards[idx],
      });
    }
    setDashboardOption(items);
  };

  const updateConfig = async () => {
    const config = await backend.getConfig();
    setClashState(config.status);
    setCurrentSub(config.current);
    setSecret(config.secret);
    setOverrideDNS(config.override_dns);
    setEnhancedMode(config.enhanced_mode);
    setAllowRemoteAccess(config.allow_remote_access);
    setCurrentDashboard(config.dashboard);
  };

  const reloadFullConfig = () => {
    updateConfig();
    updateSubscriptions();
    updateDashboards();
  }
  useEffect(reloadFullConfig, [])

  addEventListener("core_exit", (code: number) => {
    setExitCode(code);
    setClashState(false);
  });

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
            onChange={(value: boolean) => {
              // 内核操作
              if (value) {
                setExitCode(null);
                backend.setCoreStatus(true);
              } else if (exitCode === null) {
                backend.setCoreStatus(false);
              }
              // 提示操作
              if (value) {
                setSelectionTips(
                  localizationManager.getString(L.ENABLE_CLASH_IS_RUNNING)
                );
              } else if (exitCode === null || exitCode == 0) {
                setSelectionTips(
                  localizationManager.getString(L.ENABLE_CLASH_DESC)
                );
              } else {
                setSelectionTips(
                  localizationManager.getString(L.ENABLE_CLASH_FAILED) + exitCode
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
              const success = await backend.setCurrent(x.data);
              if (!success)
                setCurrentSub(localizationManager.getString(
                  L.SELECT_SUBSCRIPTION
                ));
            }}
            disabled={subOptions.length == 0}
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
              let page = "setup";
              if (currentDashboard) {
                param = `/${currentDashboard}/#`;
                if (secret) {
                  // secret 不为空时，使用完整的参数，但是不同 dashboard 使用不同的 page
                  switch (currentDashboard) {
                    case "metacubexd":
                    case "zashboard":
                      page = "setup";
                      break;
                    default:
                      page = "proxies";
                      break;
                  }
                  param += `/${page}?hostname=127.0.0.1&port=9090&secret=${secret}`;
                } else if (currentDashboard == "metacubexd") {
                  // 即使没有设置 secret，metacubexd 也会有奇怪的跳转问题，加上host和port
                  param += `/${page}?hostname=127.0.0.1&port=9090`;
                }
              }
              Navigation.NavigateToExternalWeb(
                "http://127.0.0.1:9090/ui" + param
              );
            }}
            disabled={clashState || currentDashboard === undefined}
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
            disabled={clashState}
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
  return (
    <SidebarNavigation
      title="To Moon"
      showTitle
      pages={[
        {
          title: localizationManager.getString(L.SUBSCRIPTIONS),
          content: <Subscriptions Subscriptions={shared_subs} />,
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
