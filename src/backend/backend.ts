import { callable } from "@decky/api";
import { EnhancedMode } from ".";

export const getCoreStatus = callable<[], boolean>("get_core_status");
export const setCoreStatus = callable<[boolean], []>("set_core_status");

export const getConfig = callable<[], any>("get_config");
export const getConfigValue = callable<[string], any>("get_config_value");
export const setConfigValue = callable<[string, string], []>("set_config_value");

export const upgradeToLatest = callable<[], []>("upgrade_to_latest");
export const getVersion = callable<[], string>("get_version");
export const getLatestVersion = callable<[], string>("get_latest_version");
export const upgradeToLatestCore = callable<[], []>("upgrade_to_latest_core");
export const getVersionCore = callable<[], string>("get_version_core");
export const getLatestVersionCore = callable<[], string>("get_latest_version_core");

export const getDashboardList = callable<[], string[]>("get_dashboard_list");
