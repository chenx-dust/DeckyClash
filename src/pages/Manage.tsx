import { ButtonItem, DialogBody, Menu, MenuItem, showContextMenu, showModal } from "@decky/ui";
import { useState, FC, useLayoutEffect, useEffect } from "react";
import { BsExclamationCircleFill } from "react-icons/bs";
import i18n from "i18next";

import * as backend from "../backend/backend";
import { L } from "../i18n";
import { addEventListener, removeEventListener, toaster } from "@decky/api";
import { SubscriptionField } from "../components/SubscriptionField";
import DeleteConfirmModal from "../modals/DeleteConfirmModal";
import EditSubscriptionModal from "../modals/EditSubscriptionModal";

export interface ManageProp {
  Subscriptions: Record<string, string>;
}

export const Manage: FC<ManageProp> = (props) => {
  const [subscriptions, setSubscriptions] = useState(props.Subscriptions);
  const [updating, setUpdating] = useState(false);
  const [updateTips, setUpdateTips] = useState("");

  const tipsTimeout = 10000;

  const refreshSubs = async () => {
    const subs = await backend.getSubscriptionList();
    setSubscriptions(subs);
  };

  useLayoutEffect(() => {
    refreshSubs();
    const callback = (_: string) => {
      refreshSubs();
    };
    addEventListener("sub_update", callback);
    return () => {
      removeEventListener("sub_update", callback);
    };
  }, []);

  useEffect(() => {
    if (!updating && updateTips != "") {
      const timer = setTimeout(() => {
        setUpdateTips("");
      }, tipsTimeout);
      return () => clearTimeout(timer);
    }
    return;
  }, [updateTips, updating]);

  const showCtxMenu = (name: string, url: string) => {
    return (e: MouseEvent) => {
      showContextMenu(
        <Menu label={i18n.t(L.SUBSCRIPTION_ACTIONS)}>
          <MenuItem
            onSelected={() => showModal(
              <EditSubscriptionModal
                name={name} url={url}
                checkName={(new_name) => {
                  if (/[/]/.test(new_name))
                    return i18n.t(L.NAME_INVALID_CHARACTER);
                  if (new_name != name && Object.keys(subscriptions).includes(new_name))
                    return i18n.t(L.NAME_DUPLICATED);
                  return "";
                }}
                onOk={async (new_name, new_url) => {
                  await backend.editSubscription(name, new_name, new_url);
                  refreshSubs();
                }}
              />)}
          >
            {i18n.t(L.EDIT)}
          </MenuItem>
          <MenuItem
            onSelected={() => {
              backend.duplicateSubscription(name).then(refreshSubs);
            }}
          >
            {i18n.t(L.DUPLICATE)}
          </MenuItem>
          <MenuItem
            onSelected={() => showModal(
              <DeleteConfirmModal
                name={name} url={url}
                onOk={async () => {
                  await backend.removeSubscription(name);
                  refreshSubs();
                }}
              />)}
            tone="destructive"
          >
            {i18n.t(L.DELETE)}
          </MenuItem>
        </Menu>,
        e.currentTarget ?? window,
      );
    };
  };

  return (
    <DialogBody>
      <style>
        {`
        @keyframes spin {
          0% {
              transform: rotate(0);
          }

          25% {
              transform: rotate(90deg);
          }

          50% {
              transform: rotate(180deg);
          }

          75% {
              transform: rotate(270deg);
          }

          100% {
              transform: rotate(360deg);
          }
        }
        `}
      </style>
      <ButtonItem
        layout="below"
        description={updateTips}
        onClick={async () => {
          setUpdating(true);
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
          } else {
            setUpdateTips(i18n.t(L.UPDATE_ALL_SUCCESS));
          }
          setUpdating(false);
        }}
        disabled={updating || Object.entries(subscriptions).length == 0}
      >
        {i18n.t(L.UPDATE_ALL)}
      </ButtonItem>
      {Object.keys(subscriptions).length && Object.entries(subscriptions).map(([name, url]) => {
        return (
          <SubscriptionField
            label={name}
            description={url}
            tipsTimeout={tipsTimeout}
            updateCallback={async () => {
              const [success, error] = await backend.updateSubscription(name);
              if (!success) {
                toaster.toast({
                  title: i18n.t(L.UPDATE_FAILURE),
                  body: error,
                  icon: <BsExclamationCircleFill />,
                  duration: tipsTimeout,
                });
              }
              return success;
            }}
            onOtherClick={showCtxMenu(name, url)}
          />
        );
      }) || <p style={{ textAlign: 'center' }}>{i18n.t(L.NO_SUBSCRIPTIONS)}</p>}
    </DialogBody>
  );
};
