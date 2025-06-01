import * as schinese from "./schinese.json";
import * as english from "./english.json";

export interface LanguageProps {
  label: string;
  strings: any;
  credit: string[];
  locale: string;
}

export const defaultLanguage = "english";
export const defaultLocale = "en";
export const defaultMessages = english;

export const localizeMap: { [key: string]: LanguageProps } = {
  schinese: {
    label: "简体中文",
    strings: schinese,
    credit: [],
    locale: "zh-CN",
  },
  english: {
    label: "English",
    strings: english,
    credit: [],
    locale: "en",
  },
};

// 创建一个类型安全的常量生成函数
function createLocalizeConstants<T extends readonly string[]>(keys: T) {
  return keys.reduce((obj, key) => {
    obj[key as keyof typeof obj] = key;
    return obj;
  }, {} as { [K in T[number]]: K });
}

// 定义所有键名
const I18N_KEYS = [
  "SERVICE",
  "TOOLS",
  "VERSION",
  "ABOUT",
  "DEBUG",

  // Subscriptions manager
  "SUBSCRIPTIONS",
  "SUBSCRIPTIONS_LINK",
  "SELECT_SUBSCRIPTION",
  "DOWNLOAD",
  "UPDATE_ALL",
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
  "SKIP_PROXY",
  "SKIP_PROXY_DESC",
  "OVERRIDE_DNS",
  "OVERRIDE_DNS_DESC",
  "ENHANCED_MODE",
  "ENHANCED_MODE_DESC",
  "RESTART_CORE",
  "REINSTALL_PLUGIN",
  "UPDATE_TO",
  "INSTALLED_VERSION",
  "LATEST_VERSION",
] as const;

// 创建常量对象并导出
export const L = createLocalizeConstants(I18N_KEYS);

// 导出类型
export type LocalizeStrKey = keyof typeof L;

// 为了向后兼容，保留 localizeStrEnum 名称
// export const localizeStrEnum = L;
