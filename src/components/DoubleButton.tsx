import { DialogButton, DialogButtonProps, Field, Focusable } from "@decky/ui";
import { FC, ReactNode } from "react";

export interface DoubleButtonProps {
  description?: ReactNode;
  label?: ReactNode;
  largeProps?: DialogButtonProps;
  smallProps?: DialogButtonProps;
}

export const DoubleButton: FC<DoubleButtonProps> =
  (props: DoubleButtonProps) => {
    return (
      <Field
        description={props.description}
        label={
          /* @ts-expect-error */
          <Focusable style={{
            display: 'flex',
            flexGrow: 1,
            columnGap : '10px',
          }}>
            {props.label &&
              <div class="DialogLabel" style={{ width: '100%' }}>
                {props.label}
              </div>
            }
            <DialogButton
              style={{
                flexGrow: 1
              }}
              disabled={props.largeProps?.disabled}
              onClick={props.largeProps?.onClick}
            >
              {props.largeProps?.children}
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
              disabled={props.smallProps?.disabled}
              onClick={props.smallProps?.onClick}
            >
              {props.smallProps?.children}
            </DialogButton>
          </Focusable>
        }
      />
    )
  }
