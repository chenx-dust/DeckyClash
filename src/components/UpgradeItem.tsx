import { DialogControlsSection, DialogControlsSectionHeader, Field } from "@decky/ui";
import { t } from "i18next";
import { FC } from "react";
import { L } from "../i18n";
import { ActionButtonItem } from "./ActionButtonItem";

export interface UpgradeItemProps {
  label: string;
  current: string;
  latest: string;
  children?: React.ReactNode;
  onClick?: (e: MouseEvent) => void;
}

export const UpgradeItem: FC<UpgradeItemProps> = (props) => {
  return (
    <DialogControlsSection>
      <DialogControlsSectionHeader>
        {props.label}
      </DialogControlsSectionHeader>
      <Field label={t(L.INSTALLED_VERSION)} focusable >
        {props.current}
      </Field>
      <Field label={t(L.LATEST_VERSION)} focusable >
        {props.latest}
      </Field>
      {props.children}
      <ActionButtonItem layout="inline" label={t(L.UPGRADE_LABEL)} onClick={props.onClick}>
        {(props.current !== props.latest && props.latest !== "")
          ? t(L.UPGRADE_TO) + ` ${props.latest}`
          : t(L.REINSTALL)}
      </ActionButtonItem>
    </DialogControlsSection>
  )
}