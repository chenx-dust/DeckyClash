import { DialogButton, Field, Focusable, TextField } from "@decky/ui";
import { ChangeEventHandler, FC, ReactNode } from "react";

export interface TextFieldWithButtonProps {
  disabled?: boolean;
  description?: ReactNode;
  label?: ReactNode;
  placeholder?: string;
  children?: ReactNode;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onClick?: (e: MouseEvent | GamepadEvent) => void;
}

export const TextFieldWithButton: FC<TextFieldWithButtonProps> =
  (props: TextFieldWithButtonProps) => {
    return (
      <Field
        description={props.description}
        label={
          /* @ts-expect-error */
          <Focusable style={{
            display: 'flex',
            flexWrap: 'wrap',
            flexGrow: 1,
            columnGap : '10px',
          }}>
            {props.label &&
              <div class="DialogLabel" style={{ width: '100%' }}>
                {props.label}
              </div>
            }
            <div style={{ flexGrow: 1 }}>
              <TextField
                value={props.value}
                disabled={props.disabled}
                /* @ts-expect-error */
                placeholder={props.placeholder}
                mustBeURL={true}
                onChange={props.onChange}
              />
            </div>
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
              disabled={props.disabled}
              onClick={props.onClick}
              /* @ts-expect-error */
              onOKButton={props.onClick}
            >
              {props.children}
            </DialogButton>
          </Focusable>
        }
      />
    )
  }
