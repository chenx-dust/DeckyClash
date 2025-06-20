import { DialogButton, Field, Focusable } from "@decky/ui";
import i18n from "i18next";
import { FC, ReactNode, useEffect, useState } from "react";
import { FaRedoAlt, FaEllipsisH } from 'react-icons/fa';
import { L } from "../i18n";

export interface SubscriptionFieldProps {
  label?: ReactNode;
  description?: ReactNode;
  tipsTimeout?: number;
  updateCallback?: () => Promise<boolean>;
  onOtherClick?: (e: MouseEvent) => void;
}

export const SubscriptionField: FC<SubscriptionFieldProps> =
  (props: SubscriptionFieldProps) => {
    const [updating, setUpdating] = useState(false);
    const [updateTips, setUpdateTips] = useState(i18n.t(L.UPDATE));

    useEffect(() => {
      if (!updating && updateTips != i18n.t(L.UPDATE)) {
        const timer = setTimeout(() => {
          setUpdateTips(i18n.t(L.UPDATE));
        }, props.tipsTimeout);
        return () => clearTimeout(timer);
      }
      return;
    }, [updateTips, updating]);

    return (
      <Field
        label={props.label}
        description={
          <div style={{ overflowWrap: "break-word" }}>
            {props.description}
          </div>
        }
      >
        { /* @ts-expect-error */
          <Focusable style={{
            display: 'flex',
            flexWrap: 'nowrap',
            columnGap: '10px',
          }}>
            <DialogButton
              style={{
                height: '40px',
                padding: '10px 12px',
                minWidth: '40px',
                display: 'flex',
                alignItems: 'center',
                columnGap: '8px',
              }}
              disabled={updating}
              onClick={async () => {
                if (props.updateCallback !== undefined) {
                  setUpdating(true);
                  setUpdateTips(i18n.t(L.UPDATING));
                  const success = await props.updateCallback();
                  setUpdating(false);
                  if (success) {
                    setUpdateTips(i18n.t(L.UPDATE_SUCCESS))
                  } else {
                    setUpdateTips(i18n.t(L.UPDATE_FAILURE));
                  }
                }
              }}
            >
              <FaRedoAlt style={updating && {
                animation: "spin 1s linear infinite",
              } || {}}/>
              {updateTips}
            </DialogButton>
            <DialogButton
              style={{
                height: '40px',
                width: '40px',
                padding: '10px 12px',
                minWidth: '40px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
              onClick={props.onOtherClick}
            >
              <FaEllipsisH />
            </DialogButton>
          </Focusable> }
      </Field>
    )
  }
