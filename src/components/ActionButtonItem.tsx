import { ButtonItem, ButtonItemProps, Spinner } from "@decky/ui";
import { FC, useState } from "react";

export interface ActionButtonItemProps extends ButtonItemProps {
  loading?: boolean;
  debugLabel?: string;
}

export const ActionButtonItem: FC<ActionButtonItemProps> = (props) => {
  const { onClick, disabled, children, loading, layout } = props;

  const [_loading, setLoading] = useState(loading);

  const handleClick = async (event: MouseEvent, onClick?: (e: MouseEvent) => void) => {
    try {
      setLoading(true);
      await onClick?.(event);
    } catch (e) {
      console.error(`ActionButtonItem error: ${e}`);
    } finally {
      // console.log(`ActionButtonItem: ${debugLabel} disable loading`);
      setLoading(false);
    }
  }

  const isLoading = _loading;

  return (
    <ButtonItem
      {...props}
      layout={layout ?? "below"}
      disabled={isLoading || disabled}
      onClick={(e) => handleClick(e, onClick)}

    >
      <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} >
        {children} {isLoading && <Spinner style={{ margin: '0px 8px', width: '1.1em' }} />}
      </span>
    </ButtonItem>
  );
}