import { ButtonItem, DialogControlsSection, DialogControlsSectionHeader, Field, Spinner } from "@decky/ui";
import { addEventListener, removeEventListener } from "@decky/api";
import { t } from "i18next";
import { FC, useEffect, useLayoutEffect, useState } from "react";
import { L } from "../i18n";
import { FaTimes } from "react-icons/fa";

export interface UpgradeItemProps {
  label: string;
  current: string | undefined;
  latest: string | undefined;
  children?: React.ReactNode;
  progressEvent: string;
  checkUpgrading: () => Promise<boolean>;
  cancelCallback: () => void;
  onCurrentClick?: (e: MouseEvent | CustomEvent) => void;
  onLatestClick?: (e: MouseEvent | CustomEvent) => void;
  onUpgradeClick: (e: MouseEvent) => void;
}

export const UpgradeItem: FC<UpgradeItemProps> = (props) => {
  const [upgrading, setUpgrading] = useState(false);
  const [progress, setProgress] = useState(-1);
  const [upgradeLabel, setUpgradeLabel] = useState(t(L.UPGRADE_LABEL));

  useLayoutEffect(() => {
    const callback = (percent: number) => {
      setProgress(percent);
    };
    addEventListener(props.progressEvent, callback);
    return () => {
      removeEventListener(props.progressEvent, callback);
    };
  }, []);

  useEffect(() => {
    if (upgrading) {
      if (progress === -1) {
        setUpgradeLabel(t(L.UPGRADE_INSTALLING));
      } else {
        setUpgradeLabel(`${t(L.UPGRADE_PROGRESS)} ${progress}%`);
      }
    } else {
      setProgress(-1);
      setUpgradeLabel(t(L.UPGRADE_LABEL));
    }
  }, [upgrading, progress]);

  useEffect(() => {
    props.checkUpgrading().then(setUpgrading);
  }, []);

  return (
    <DialogControlsSection>
      <DialogControlsSectionHeader>
        {props.label}
      </DialogControlsSectionHeader>
      <Field label={t(L.INSTALLED_VERSION)} onClick={props.onCurrentClick} >
        {props.current === undefined ? <Spinner style={{ margin: '0px 8px', width: '1.1em' }} /> : props.current || <FaTimes />}
      </Field>
      <Field label={t(L.LATEST_VERSION)} onClick={props.onLatestClick} >
        {props.latest === undefined ? <Spinner style={{ margin: '0px 8px', width: '1.1em' }} /> : props.latest || <FaTimes />}
      </Field>
      {props.children}
      <ButtonItem
        layout="inline"
        label={<span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} >
          {upgradeLabel}
          {upgrading && <Spinner style={{ margin: '0px 8px', width: '1.1em' }} />}
        </span>}
        disabled={!props.latest && !upgrading}
        onClick={async (e) => {
          if (upgrading) {
            props.cancelCallback();
            setUpgrading(false);
          } else {
            setUpgrading(true);
            await props.onUpgradeClick(e);
            setUpgrading(false);
          }
        }}
      >
        {upgrading ? t(L.CANCEL)
          : ((props.current !== props.latest && props.current?.startsWith("v") && props.latest?.startsWith("v")) ?
            t(L.UPGRADE_TO) + ` ${props.latest}` :
            t(L.REINSTALL))}
      </ButtonItem>
    </DialogControlsSection>
  )
}
