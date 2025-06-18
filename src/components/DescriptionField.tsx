import { Field } from "@decky/ui";
import { FC } from "react";

export interface DescriptionFieldProps {
  label: string;
  children?: React.ReactNode;
}

export const DescriptionField: FC<DescriptionFieldProps> =
  (props: DescriptionFieldProps) => {
  return (
    <Field
      label={
      <div style={{ display: "block" }}>
          <h2
          style={{ fontWeight: "bold", fontSize: "1.5em", marginBottom: "0px" }}
          >
          {props.label}
          </h2>
          <br />
          {props.children}
      </div>
      }
      focusable={true}
    />
  )
}