import { DialogButton, Field, Focusable, GamepadEvent, GamepadButton } from "@decky/ui";
import { t } from 'i18next';
import { FC, ForwardedRef, forwardRef, ReactNode, RefAttributes, useEffect, useImperativeHandle, useState } from "react";
import { FaRedoAlt, FaEllipsisH, FaCopy, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { L } from "../i18n";
import { TIPS_TIMEOUT } from "../global";
import { IconButton } from "./IconButton";

export interface SubscriptionFieldProps {
  label: ReactNode;
  description?: ReactNode;
  updateCallback?: () => Promise<boolean>;
  onOtherClick?: (e: MouseEvent) => void;
  editMode: boolean;
  onEditClick?: (e: MouseEvent) => void;
  onCopyClick?: (e: MouseEvent) => void;
  onDelClick?: (e: MouseEvent) => void;
  reorderEnabled?: boolean;
  reorderCallback?: (diff: number) => void;
  reorderFinishCallback?: (save: boolean) => void;
}

interface Updatable {
  update: () => void;
}
export type CallbackRef = Updatable | null;

export const SubscriptionField: FC<SubscriptionFieldProps & RefAttributes<any>> =
  forwardRef((props: SubscriptionFieldProps, ref: ForwardedRef<CallbackRef>) => {
    const [updating, setUpdating] = useState(false);
    const [updateTips, setUpdateTips] = useState(t(L.UPDATE));
    const [isSelected, _setIsSelected] = useState(false);
    const [isSelectedLastFrame, setIsSelectedLastFrame] = useState(false);

    const handleUpdateClick = () => {
      if (props.updateCallback === undefined)
        return;
      setUpdating(true);
      setUpdateTips(t(L.UPDATING));
      props.updateCallback().then((success) => {
        setUpdating(false);
        if (success) {
          setUpdateTips(t(L.UPDATE_SUCCESS))
        } else {
          setUpdateTips(t(L.UPDATE_FAILURE));
        }
      });
    };

    useImperativeHandle(ref, () => {
      return { update: handleUpdateClick };
    }, []);

    useEffect(() => {
      if (!updating && updateTips != t(L.UPDATE)) {
        const timer = setTimeout(() => {
          setUpdateTips(t(L.UPDATE));
        }, TIPS_TIMEOUT);
        return () => clearTimeout(timer);
      }
      return;
    }, [updateTips, updating]);

    // modified from @decky/ui/dist/custom-components/ReorderableList.js
    const onReorder = (e: GamepadEvent) => {
      if (!props.reorderCallback)
        return;
      if (!props.reorderEnabled)
        return;
      const event = e;
      if (event.detail.button == GamepadButton.DIR_DOWN)
        props.reorderCallback(+1);
      else if (event.detail.button == GamepadButton.DIR_UP)
        props.reorderCallback(-1);
    };

    const setIsSelected = async (val: boolean) => {
      _setIsSelected(val);
      for (let i = 0; i < 3; i++)
        await new Promise((res) => requestAnimationFrame(res));
      setIsSelectedLastFrame(val);
    };

    return (
      <div style={{
          transition: isSelected || isSelectedLastFrame
            ? ''
            : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
          transform: !props.reorderEnabled || isSelected ? 'scale(1)' : 'scale(0.9)',
          opacity: !props.reorderEnabled || isSelected ? 1 : 0.7,
        }}>
        <Field
          label={props.label}
          description={
            <div style={{ overflowWrap: "break-word" }}>
              {props.description}
            </div>
          }
          onButtonDown={onReorder}
          onGamepadBlur={() => setIsSelected(false)}
          onGamepadFocus={() => setIsSelected(true)}
          onOKButton={props.reorderEnabled
            ? () => props.reorderFinishCallback?.(true)
            : undefined}
          onOKActionDescription={props.reorderEnabled ? t(L.SAVE) : undefined}
          onCancelButton={props.reorderEnabled
            ? () => props.reorderFinishCallback?.(false)
            : undefined}
          onCancelActionDescription={props.reorderEnabled ? t(L.CANCEL) : undefined}
          focusable={props.reorderEnabled}
        >
          {/* @ts-expect-error */}
          <Focusable style={{
            display: 'flex',
            flexWrap: 'nowrap',
            columnGap: '10px',
          }}>
            {props.editMode ? (<>
              {props.onEditClick && <IconButton
                onClick={props.onEditClick}
                disabled={props.reorderEnabled}
              >
                <FaEdit />
              </IconButton>}
              {props.onCopyClick && <IconButton
                onClick={props.onCopyClick}
                disabled={props.reorderEnabled}
              >
                <FaCopy />
              </IconButton>}
              {props.onDelClick && <IconButton
                style={{ color: 'red' }}
                onClick={props.onDelClick}
                disabled={props.reorderEnabled}
              >
                <FaTrashAlt />
              </IconButton>}
            </>) : (<>
                {props.updateCallback && <DialogButton
                  style={{
                    padding: '10px 12px',
                    minWidth: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    columnGap: '8px',
                  }}
                  disabled={updating || props.reorderEnabled}
                  onClick={handleUpdateClick}
                >
                  <FaRedoAlt style={updating ? {
                    animation: "dc_spin 1s linear infinite",
                  } : undefined} />
                  {updateTips}
                </DialogButton>}
                {props.onOtherClick && <IconButton
                  onClick={props.onOtherClick}
                  disabled={props.reorderEnabled}
                >
                  <FaEllipsisH />
                </IconButton>}
            </>)}
          </Focusable>
        </Field>
      </div>
    )
  });
