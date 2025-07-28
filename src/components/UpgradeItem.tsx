import { DialogControlsSection, DialogControlsSectionHeader, Field, Spinner } from "@decky/ui";
import { t } from "i18next";
import { FC } from "react";
import { L } from "../i18n";
import { ActionButtonItem } from "./ActionButtonItem";

export interface UpgradeItemProps {
  label: string;
  current: string;
  latest: string;
  children?: React.ReactNode;
  onCurrentClick?: (e: MouseEvent | CustomEvent) => void;
  onLatestClick?: (e: MouseEvent | CustomEvent) => void;
  onUpgradeClick?: (e: MouseEvent) => void;
}

export const UpgradeItem: FC<UpgradeItemProps> = (props) => {
  return (
    <DialogControlsSection>
      <DialogControlsSectionHeader>
        {props.label}
      </DialogControlsSectionHeader>
      <Field label={t(L.INSTALLED_VERSION)} onClick={props.onCurrentClick} >
        {props.current || <Spinner style={{ margin: '0px 8px', width: '1.1em' }} />}
      </Field>
      <Field label={t(L.LATEST_VERSION)} onClick={props.onLatestClick} >
        {props.latest || <Spinner style={{ margin: '0px 8px', width: '1.1em' }} />}
      </Field>
      {props.children}
      <ActionButtonItem layout="inline" label={t(L.UPGRADE_LABEL)} onClick={props.onUpgradeClick}>
        {(props.current !== props.latest && props.current !== "" && props.latest !== "")
          ? t(L.UPGRADE_TO) + ` ${props.latest}`
          : t(L.REINSTALL)}
      </ActionButtonItem>
    </DialogControlsSection>
  )
}
