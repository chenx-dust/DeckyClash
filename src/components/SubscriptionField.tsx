import { DialogButton, Field, Focusable } from "@decky/ui";
import i18n from "i18next";
import { CSSProperties, FC, ForwardedRef, forwardRef, ReactNode, RefAttributes, useEffect, useImperativeHandle, useState } from "react";
import { FaRedoAlt, FaEllipsisH, FaCopy, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { L } from "../i18n";
import { TIPS_TIMEOUT } from "../global";

const IconButton: FC<{
  icon: ReactNode;
  style?: CSSProperties;
  onClick: (e: MouseEvent) => void;
}> = ({ icon, style, onClick }) => (
    <DialogButton
      style={{
        ...style,
        height: '40px',
        width: '40px',
        padding: '10px 12px',
        minWidth: '40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
      onClick={onClick}
    >
      {icon}
    </DialogButton>
  );

export interface SubscriptionFieldProps {
  label?: ReactNode;
  description?: ReactNode;
  updateCallback: () => Promise<boolean>;
  onOtherClick?: (e: MouseEvent) => void;
  editMode: boolean;
  onEditClick?: (e: MouseEvent) => void;
  onCopyClick?: (e: MouseEvent) => void;
  onDelClick?: (e: MouseEvent) => void;
}

export type CallbackRef = (() => void) | null;

export const SubscriptionField: FC<SubscriptionFieldProps & RefAttributes<any>> =
  forwardRef((props: SubscriptionFieldProps, ref: ForwardedRef<CallbackRef>) => {
    const [updating, setUpdating] = useState(false);
    const [updateTips, setUpdateTips] = useState(i18n.t(L.UPDATE));

    const handleUpdateClick = () => {
      setUpdating(true);
      setUpdateTips(i18n.t(L.UPDATING));
      props.updateCallback().then((success) => {
        setUpdating(false);
        if (success) {
          setUpdateTips(i18n.t(L.UPDATE_SUCCESS))
        } else {
          setUpdateTips(i18n.t(L.UPDATE_FAILURE));
        }
      });
    };

    useImperativeHandle(ref, () => handleUpdateClick, []);

    useEffect(() => {
      if (!updating && updateTips != i18n.t(L.UPDATE)) {
        const timer = setTimeout(() => {
          setUpdateTips(i18n.t(L.UPDATE));
        }, TIPS_TIMEOUT);
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
            {props.editMode ? (<>
              {props.onEditClick && <IconButton icon={<FaEdit />} onClick={props.onEditClick} />}
              {props.onCopyClick && <IconButton icon={<FaCopy />} onClick={props.onCopyClick} />}
              {props.onDelClick && <IconButton style={{ color: 'red' }} icon={<FaTrashAlt />} onClick={props.onDelClick} />}
            </>) : (<>
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
                onClick={handleUpdateClick}
              >
                <FaRedoAlt style={updating ? {
                  animation: "dc_spin 1s linear infinite",
                } : undefined} />
                {updateTips}
              </DialogButton>
              {props.onOtherClick && <IconButton icon={<FaEllipsisH />} onClick={props.onOtherClick} />}
            </>)}
          </Focusable>}
      </Field>
    )
  });
