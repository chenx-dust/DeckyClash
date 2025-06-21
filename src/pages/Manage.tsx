import { DialogBody, DialogButton, Field, Focusable, Menu, MenuItem, showContextMenu, showModal } from "@decky/ui";
import { useState, FC, useLayoutEffect, useRef, RefObject } from "react";
import { BsExclamationCircleFill } from "react-icons/bs";
import i18n from "i18next";

import { backend } from "../backend";
import { L } from "../i18n";
import { addEventListener, removeEventListener, toaster } from "@decky/api";
import { CallbackRef, SubscriptionField } from "../components";
import { DeleteConfirmModal, EditSubscriptionModal } from "../modals";
import { TIPS_TIMEOUT } from "../global";

export interface ManageProp {
  Subscriptions: Record<string, string>;
}

export const Manage: FC<ManageProp> = (props) => {
  const [subscriptions, setSubscriptions] = useState(props.Subscriptions);
  const [editMode, setEditMode] = useState(false);
  const refs: RefObject<Record<string, CallbackRef>> = useRef({});

  const updateSubs = () => 
    Object.values(refs.current).forEach(ref => ref?.());

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

  const showEditModal = (name: string, url: string) => showModal(
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
    />);

  const showCtxMenu = (name: string, url: string) => {
    return (e: MouseEvent) => {
      showContextMenu(
        <Menu label={i18n.t(L.SUBSCRIPTION_ACTIONS)}>
          <MenuItem
            onSelected={() => showEditModal(name, url)}
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
      <Field label={i18n.t(L.SUBSCRIPTION_LIST)}>
        { /* @ts-expect-error */
          <Focusable style={{
            display: 'flex',
            flexWrap: 'nowrap',
            columnGap: '10px',
          }}>
            <DialogButton
              disabled={Object.entries(subscriptions).length == 0}
              onClick={updateSubs}
            >
              {i18n.t(L.UPDATE_ALL)}
            </DialogButton>
            <DialogButton
              disabled={Object.entries(subscriptions).length == 0}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? i18n.t(L.QUICK_EDIT_EXIT) : i18n.t(L.QUICK_EDIT)}
            </DialogButton>
          </Focusable>}
      </Field>
      <style>
        {`
@keyframes dc_spin {
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
      {Object.keys(subscriptions).length > 0 ? Object.entries(subscriptions).map(([name, url]) => {
        return (
          <SubscriptionField
            ref={(el) => refs.current[name] = el}
            label={name}
            description={url}
            editMode={editMode}
            updateCallback={async () => {
              const [success, error] = await backend.updateSubscription(name);
              if (!success) {
                toaster.toast({
                  title: i18n.t(L.UPDATE_FAILURE),
                  body: error,
                  icon: <BsExclamationCircleFill />,
                  duration: TIPS_TIMEOUT,
                });
              }
              return success;
            }}
            onOtherClick={showCtxMenu(name, url)}
            onEditClick={() => showEditModal(name, url)}
            onCopyClick={() => backend.duplicateSubscription(name).then(refreshSubs)}
            onDelClick={() => backend.removeSubscription(name).then(refreshSubs)}
          />
        );
      }) : <p style={{ textAlign: 'center' }}>{i18n.t(L.NO_SUBSCRIPTIONS)}</p>}
    </DialogBody>
  );
};
