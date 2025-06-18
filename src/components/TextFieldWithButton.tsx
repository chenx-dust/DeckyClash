import { ButtonItem, TextField } from "@decky/ui";
import { ChangeEventHandler, FC, ReactNode } from "react";

export interface TextFieldWithButtonProps {
  disabled?: boolean;
  description?: ReactNode;
  label?: ReactNode;
  placeholder?: string;
  children?: ReactNode;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onClick?: (e: MouseEvent) => void;
  loading?: boolean;
  debugLabel?: string;
}

export const TextFieldWithButton: FC<TextFieldWithButtonProps> =
  (props: TextFieldWithButtonProps) => {
    return (<>
      <style>
        {`
          .tfwb-small-button > div {
            padding-top: 0px !important;
            padding-bottom: 0px !important;
            background: none !important;
            color: unset !important;
          }
          .tfwb-small-button button {
            min-width: unset !important;
          }
          .tfwb-component {
            padding-bottom: 10px;
            padding-top: 10px;
            position: relative;
          }
          .tfwb-component::after {
            bottom: -0.5px;
            height: 1px;
            background: rgba(255,255,255,.1);
            content: "";
            position: absolute;
            left: 0;
            right: 0;
          }
        `}
      </style>
      <div class="tfwb-component">
        {props.label && (
          <div class="DialogLabel">
            {props.label}
          </div>
        )}
        <div style={{
          display: "flex",
          flexDirection: "row",
          gap: "10px"
        }}>
          <div style={{ flexGrow: 1 }}>
            <TextField
              value={props.value}
              disabled={props.disabled}
              /* @ts-expect-error */
              placeholder={props.placeholder}
              onChange={props.onChange}
            />
          </div>
          <div class="tfwb-small-button">
            <ButtonItem
              layout="below"
              bottomSeparator="none"
              disabled={props.disabled}
              onClick={props.onClick}
            >
              {props.children}
            </ButtonItem>
          </div>
          {props.description && (
            <div class="DialogLabelExplainer">
              {props.description}
            </div>
          )}
        </div>
      </div>
    </>)
  }