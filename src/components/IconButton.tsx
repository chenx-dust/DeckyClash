import { DialogButton } from "@decky/ui";
import { CSSProperties, FC, ReactNode } from "react";

export const IconButton: FC<{
  children?: ReactNode;
  style?: CSSProperties;
  onClick?: (e: MouseEvent) => void;
  disabled?: boolean;
}> = ({ children, style, onClick, disabled }) =>
  (<DialogButton
    style={{
      ...style,
      aspectRatio: '1 / 1',
      padding: '10px 12px',
      width: 'fit-content',
      minWidth: 'auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </DialogButton>);
