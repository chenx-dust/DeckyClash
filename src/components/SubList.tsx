import { ButtonItem } from "@decky/ui";
import { toaster } from "@decky/api";
import { FC } from "react";
import * as backend from "../backend/backend";
import { localizationManager, L } from "../i18n";
interface appProp {
  Subscriptions: Array<any>;
  UpdateSub: any;
  Refresh: Function;
}

export const SubList: FC<appProp> = ({ Subscriptions, UpdateSub, Refresh }) => {
  return (
    <div>
      {Subscriptions.map((x) => {
        return (
          <div>
            <ButtonItem
              label={x.name}
              description={x.url}
              onClick={() => {
                //删除订阅
                backend.resolve(backend.deleteSub(x.id), (rtn: [boolean, String]) => {
                  const [success, message] = rtn;
                  if (success) {
                    UpdateSub((source: Array<any>) => {
                      let i = source.indexOf(x);
                      source.splice(i, 1);
                      return source;
                    });
                    Refresh();
                  } else {
                    console.log("delete sub fail.");
                    toaster.toast({
                      title: localizationManager.getString(L.DELETE_FAILURE),
                      body: message,
                    });
                  }
                });
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
