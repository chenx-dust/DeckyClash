import { ButtonItem } from "@decky/ui";
import { FC } from "react";
import * as backend from "../backend/backend";
import { localizationManager, L } from "../i18n";
import { BsExclamationCircleFill } from "react-icons/bs";
import { toaster } from "@decky/api";
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
              onClick={async () => {
                //删除订阅
                const success = await backend.removeSubscription(name);
                if (!success) {
                  toaster.toast({
                    title: localizationManager.getString(L.DELETE_FAILURE),
                    body: name,
                    icon: <BsExclamationCircleFill />,
                  });
                }
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
