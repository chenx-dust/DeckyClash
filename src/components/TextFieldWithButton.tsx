import { Field, Focusable, TextField } from "@decky/ui";
import { ChangeEventHandler, FC, ReactNode } from "react";
import { IconButton } from "./IconButton";

export interface TextFieldWithButtonProps {
  disabled?: boolean;
  description?: ReactNode;
  label?: ReactNode;
  placeholder?: string;
  children?: ReactNode;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onClick?: (e: MouseEvent) => void;
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
            <IconButton
              disabled={props.disabled}
              onClick={props.onClick}
            >
              {props.children}
            </IconButton>
          </Focusable>
        }
      />
    )
  }
