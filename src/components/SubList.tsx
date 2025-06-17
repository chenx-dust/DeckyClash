import { ButtonItem } from "@decky/ui";
import { FC } from "react";
import * as backend from "../backend/backend";
import { localizationManager, L } from "../i18n";
interface appProp {
  Subscriptions: Record<string, string>;
  Refresh: Function;
}

export const SubList: FC<appProp> = ({ Subscriptions, Refresh }) => {
  return (
    <div>
      {Object.entries(Subscriptions).map((x) => {
        const [name, url] = x;
        return (
          <div>
            <ButtonItem
              label={name}
              description={url}
              onClick={() => {
                //删除订阅
                backend.removeSubscription(name);
                Refresh();
              }}
            >
              {localizationManager.getString(L.DELETE)}
            </ButtonItem>
          </div>
        );
      })}
    </div>
  );
};
