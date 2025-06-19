import schinese from "./schinese.json";
import english from "./english.json";

export interface LanguageProps {
  label: string;
  strings: any;
  credit: string[];
  locale: string;
}

export const defaultLanguage = "english";
export const defaultLocale = "en";
export const defaultMessages = english;

export const langProps: { [key: string]: LanguageProps } = {
  schinese: {
    label: "简体中文",
    strings: schinese,
    credit: [],
    locale: "zh-Hans",
  },
  english: {
    label: "English",
    strings: english,
    credit: [],
    locale: "en",
  },
};

export const L = Object.keys(defaultMessages).reduce((obj, key) => {
  obj[key as keyof typeof obj] = key;
  return obj;
}, {} as typeof defaultMessages);
