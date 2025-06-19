import { ButtonItem } from "@decky/ui";
import { useState, FC, useEffect } from "react";
import { SubList } from "../components";
import { BsCheckCircleFill, BsExclamationCircleFill } from "react-icons/bs";
import i18n from "i18next";

import * as backend from "../backend/backend";
import { L } from "../i18n";
import { addEventListener, removeEventListener, toaster } from "@decky/api";

export interface ManageProp {
  Subscriptions: Record<string, string>;
}

export const Manage: FC<ManageProp> = ({ Subscriptions }) => {
  const [subscriptions, setSubscriptions] = useState(Subscriptions);
  const [updateBtnDisable, setUpdateBtnDisable] = useState(false);
  const [updateTips, setUpdateTips] = useState("");

  const tipTimeout = 10000;

  useEffect(() => {
    backend.setExternalStatus(true);
    const callback = (name: string) => {
      toaster.toast({
        title: i18n.t(L.DOWNLOAD_SUCCESS),
        body: name,
        icon: <BsCheckCircleFill />,
      });
      refreshSubs();
    };
    addEventListener("sub_update", callback);
    return () => {
      backend.setExternalStatus(false);
      removeEventListener("sub_update", callback);
    };
  }, []);

  const refreshSubs = async () => {
    const subs = await backend.getSubscriptionList();
    setSubscriptions(subs);
  };

  return (
    <>
      <ButtonItem
        layout="below"
        description={updateTips}
        onClick={async () => {
          setUpdateBtnDisable(true);
          setUpdateTips(i18n.t(L.UPDATING));
          const failed = await backend.updateAllSubscriptions();
          if (failed.length > 0) {
            const error = failed.map((x) => `${x[0]}: ${x[1]}`).join("\n");
            toaster.toast({
              title: i18n.t(L.UPDATE_FAILURE),
              body: error,
              icon: <BsExclamationCircleFill />,
            });
            setUpdateTips(i18n.t(L.UPDATE_FAILURE) + ": " + error);
            setTimeout(() => {
              setUpdateTips("");
            }, tipTimeout);
          } else {
            setUpdateTips(i18n.t(L.UPDATE_SUCCESS));
            setTimeout(() => {
              setUpdateTips("");
            }, tipTimeout);
          }
          setUpdateBtnDisable(false);
        }}
        disabled={updateBtnDisable || Object.entries(subscriptions).length == 0}
      >
        {i18n.t(L.UPDATE_ALL)}
      </ButtonItem>
      <SubList
        Subscriptions={subscriptions}
        Refresh={refreshSubs}
      ></SubList>
    </>
  );
};
