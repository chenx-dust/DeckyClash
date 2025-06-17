import { callable } from "@decky/api";
import { Config } from ".";

export const getCoreStatus = callable<[], boolean>("get_core_status");
export const setCoreStatus = callable<[boolean], [boolean, string]>("set_core_status");
export const restartCore = callable<[], boolean>("restart_core");

export const getConfig = callable<[], Config>("get_config");
export const getConfigValue = callable<[string], any>("get_config_value");
export const setConfigValue = callable<[string, any], []>("set_config_value");

export const upgradeToLatest = callable<[], [boolean, string]>("upgrade_to_latest");
export const getVersion = callable<[], string>("get_version");
export const getLatestVersion = callable<[], string>("get_latest_version");
export const upgradeToLatestCore = callable<[], [boolean, string]>("upgrade_to_latest_core");
export const getVersionCore = callable<[], string>("get_version_core");
export const getLatestVersionCore = callable<[], string>("get_latest_version_core");

export const getSubscriptionList = callable<[], Record<string, string>>("get_subscription_list");
export const updateAllSubscriptions = callable<[], Array<[string, string]>>("update_all_subscriptions");
export const downloadSubscription = callable<[string], [boolean, string]>("download_subscription");
export const removeSubscription = callable<[string], boolean>("remove_subscription");
export const setCurrent = callable<[string], boolean>("set_current");

export const getDashboardList = callable<[], string[]>("get_dashboard_list");

export const getIP = callable<[], string>("get_ip");
export const setExternalStatus = callable<[boolean], []>("set_external_status");
