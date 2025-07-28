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
  cancelCallback: () => void;
  onCurrentClick?: (e: MouseEvent | CustomEvent) => void;
  onLatestClick?: (e: MouseEvent | CustomEvent) => void;
  onUpgradeClick: (e: MouseEvent) => void;
}

export const UpgradeItem: FC<UpgradeItemProps> = (props) => {
  const [upgrading, setUpgrading] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [progress, setProgress] = useState(-1);
  const [upgradeLabel, setUpgradeLabel] = useState(t(L.UPGRADE_LABEL));

  useLayoutEffect(() => {
    const callback = (percent: number) => {
      if (percent >= 0) {
        setProgress(percent);
      } else {
        setInstalling(true);
      }
    };
    addEventListener(props.progressEvent, callback);
    return () => {
      removeEventListener(props.progressEvent, callback);
    };
  }, []);

  useEffect(() => {
    if (upgrading) {
      if (installing) {
        setDisabled(true);
        setUpgradeLabel(t(L.UPGRADE_INSTALLING));
      } else if (progress >= 0) {
        setDisabled(false); // cancelable
        setUpgradeLabel(`${t(L.UPGRADE_PROGRESS)} ${progress}%`);
      } else {
        setDisabled(true);
      }
    } else {
      setDisabled(false);
      setProgress(-1);
      setUpgradeLabel(t(L.UPGRADE_LABEL));
    }
  }, [upgrading, installing, progress]);

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
        disabled={disabled}
        onClick={async (e) => {
          if (upgrading) {
            props.cancelCallback();
            setUpgrading(false);
            setInstalling(false);
          } else {
            setUpgrading(true);
            setInstalling(false);
            await props.onUpgradeClick(e);
            setUpgrading(false);
          }
        }}
      >
        {upgrading ? t(L.CANCEL)
          : ((props.current !== props.latest && props.current && props.latest) ?
            t(L.UPGRADE_TO) + ` ${props.latest}` :
            t(L.REINSTALL))}
      </ButtonItem>
    </DialogControlsSection>
  )
}
