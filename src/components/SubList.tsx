import { ButtonItem } from "@decky/ui";
import { FC } from "react";
import * as backend from "../backend/backend";
import { L } from "../i18n";
import { BsExclamationCircleFill } from "react-icons/bs";
import { toaster } from "@decky/api";
import i18n from "i18next";

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
          <ButtonItem
            label={name}
            description={url}
            onClick={async () => {
              const success = await backend.removeSubscription(name);
              if (!success) {
                toaster.toast({
                  title: i18n.t(L.DELETE_FAILURE),
                  body: name,
                  icon: <BsExclamationCircleFill />,
                });
              }
              Refresh();
            }}
          >
            {i18n.t(L.DELETE)}
          </ButtonItem>
        );
      })}
    </div>
  );
};
