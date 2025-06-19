import { defaultLocale, langProps } from "./props";

import i18n, { Resource } from "i18next";

export class localizationManager {
  private static language = "english";

  public static async init() {
    const language =
      (await SteamClient.Settings.GetCurrentLanguage()) || "english";
    this.language = language;

    const resources: Resource = Object.keys(langProps).reduce(
      (acc, key) => {
        acc[langProps[key].locale] = {
          translation: langProps[key].strings,
        };
        return acc;
      },
      {} as Resource
    );

    i18n.init({
      resources: resources,
      lng: this.getLocale(),
      fallbackLng: defaultLocale,
      returnEmptyString: false,
      interpolation: {
        escapeValue: false,
      },
    });
  }

  private static getLocale() {
    return langProps[this.language]?.locale ?? defaultLocale;
  }
}
