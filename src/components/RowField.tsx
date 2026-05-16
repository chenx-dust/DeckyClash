import { Field, Focusable } from "@decky/ui";
import { FC, ReactNode } from "react";

export interface RowFieldProps {
  description?: ReactNode;
  label?: ReactNode;
  children?: ReactNode;
}

export const RowField: FC<RowFieldProps> =
  (props: RowFieldProps) => {
    return (
      <Field
        description={props.description}
        label={props.label}
        childrenLayout="below"
      >
        {/* @ts-expect-error */}
        <Focusable style={{
          display: 'flex',
          flexGrow: 1,
          columnGap: '10px',
        }}>
          {props.children}
        </Focusable>
      </Field>
    )
  }
