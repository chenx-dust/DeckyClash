import zh_CN from "./zh_CN.json";
import en from "./en.json";

export interface LanguageProps {
  label: string;
  strings: any;
  credit: string[];
  locale: string;
}

export const defaultLanguage = "english";
export const defaultLocale = "en";
export const defaultMessages = en;

export const localizeMap: { [key: string]: LanguageProps } = {
  schinese: {
    label: "中文（中国）",
    strings: zh_CN,
    credit: [],
    locale: "zh-CN",
  },
  english: {
    label: "English",
    strings: en,
    credit: [],
    locale: "en",
  },
};

// generate key from array
function createLocalizeConstants<T extends readonly string[]>(keys: T) {
  return keys.reduce((obj, key) => {
    obj[key as keyof typeof obj] = key;
    return obj;
  }, {} as { [K in T[number]]: K });
}

const I18N_KEYS = [
  "SERVICE",
  "TOOLS",
  "VERSION",
  "ABOUT",
  "ACKNOWLEDGE",

  // Subscriptions manager
  "SUBSCRIPTIONS",
  "SUBSCRIPTIONS_LINK",
  "SELECT_SUBSCRIPTION",
  "DOWNLOAD",
  "DOWNLOADING",
  "DOWNLOAD_SUCCESS",
  "DOWNLOAD_FAILURE",
  "UPDATE_ALL",
  "UPDATING",
  "UPDATE_SUCCESS",
  "UPDATE_FAILURE",
  "DELETE",
  "DELETE_FAILURE",

  // QAM
  "ENABLE_CLASH",
  "ENABLE_CLASH_DESC",
  "ENABLE_CLASH_FAILED",
  "ENABLE_CLASH_LOADING",
  "ENABLE_CLASH_IS_RUNNING",
  "MANAGE_SUBSCRIPTIONS",
  "OPEN_DASHBOARD",
  "SELECT_DASHBOARD",
  "ALLOW_REMOTE_ACCESS",
  "ALLOW_REMOTE_ACCESS_DESC",
  "OVERRIDE_DNS",
  "OVERRIDE_DNS_DESC",
  "ENHANCED_MODE",
  "ENHANCED_MODE_DESC",
  "RELOAD_CONFIG",
  "RESTART_CORE",
  "REINSTALL_PLUGIN",
  "PLUGIN_INSTALLED",
  "PLUGIN_INSTALL_FAILED",
  "UPDATE_TO",
  "INSTALLED_VERSION",
  "LATEST_VERSION",
  "REINSTALL_CORE",
  "CORE_INSTALLED",
  "CORE_INSTALL_FAILED",
  "UPDATE_TO_CORE",
  "INSTALLED_CORE_VERSION",
  "LATEST_CORE_VERSION",
  "CLASH_EXIT_TITLE",
] as const;

export const L = createLocalizeConstants(I18N_KEYS);

export type LocalizeStrKey = keyof typeof L;
