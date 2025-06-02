import { ButtonItem } from "@decky/ui";
import { FC } from "react";
import * as backend from "../backend/backend";
import { localizationManager, L } from "../i18n";
interface appProp {
  Subscriptions: Record<string, string>;
  UpdateSub: any;
  Refresh: Function;
}

export const SubList: FC<appProp> = ({ Subscriptions, UpdateSub, Refresh }) => {
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
                UpdateSub((source: Array<any>) => {
                  let i = source.indexOf(x);
                  source.splice(i, 1);
                  return source;
                });
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
