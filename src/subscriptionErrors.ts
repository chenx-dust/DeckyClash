import { t } from "i18next";

import { L } from "./i18n";

export enum SubscriptionError {
  HwidNotSupported = "HWID_NOT_SUPPORTED",
}

export const localizeSubscriptionError = (error?: string | null): string => {
  switch (error) {
    case SubscriptionError.HwidNotSupported:
      return t(L.HWID_NOT_SUPPORTED);
    default:
      return error || "";
  }
};
