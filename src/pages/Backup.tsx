import { toaster } from "@decky/api";
import { ConfirmModal, DialogBody, DialogButton, DialogControlsSection, DialogControlsSectionHeader, Field, Focusable, TextField, showModal } from "@decky/ui";
import { t } from "i18next";
import { FC, useLayoutEffect, useState } from "react";
import { BsCheckCircleFill, BsCloudDownloadFill, BsCloudUploadFill, BsExclamationCircleFill } from "react-icons/bs";

import { backend } from "../backend";
import { FullWidthFieldScope } from "../components";
import { L } from "../i18n";

export const Backup: FC = () => {
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    backend.getWebDAVConfig().then((config) => {
      setUrl(config.url);
      setUsername(config.username);
      setPassword(config.password);
    });
  }, []);

  const saveConfig = async () => {
    const [success, error] = await backend.setWebDAVConfig(url, username, password);
    if (!success) {
      console.error("[WebDAV] Failed to save config:", error);
    }
    return success;
  };

  const testConfig = async () => {
    setBusy(true);
    try {
      if (!(await saveConfig())) {
        return;
      }
      const [success, error] = await backend.testWebDAVConfig();
      toaster.toast({
        title: success ? t(L.WEBDAV_TEST_SUCCESS) : t(L.WEBDAV_TEST_FAILURE),
        body: success ? url : error,
        icon: success ? <BsCheckCircleFill /> : <BsExclamationCircleFill />,
      });
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (
    action: () => Promise<[boolean, string]>,
    successTitle: string,
    failureTitle: string,
  ) => {
    setBusy(true);
    try {
      if (!(await saveConfig())) {
        return;
      }
      const [success, error] = await action();
      if (success) {
        toaster.toast({
          title: successTitle,
          body: url,
          icon: <BsCheckCircleFill />,
        });
      } else {
        toaster.toast({
          title: failureTitle,
          body: error,
          icon: <BsExclamationCircleFill />,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const backup = () => runAction(
    () => backend.backupSettingsToWebDAV(),
    t(L.BACKUP_SUCCESS),
    t(L.BACKUP_FAILURE),
  );

  const restore = () => runAction(
    async () => {
      const result = await backend.restoreSettingsFromWebDAV();
      if (result[0]) {
        window.localStorage.removeItem("decky-clash-config");
        window.localStorage.removeItem("decky-clash-subscriptions");
        window.localStorage.removeItem("decky-clash-dashboards");
      }
      return result;
    },
    t(L.RESTORE_SUCCESS),
    t(L.RESTORE_FAILURE),
  );

  const confirmRestore = () => showModal(
    <ConfirmModal
      strTitle={t(L.RESTORE_SETTINGS)}
      strOKButtonText={t(L.RESTORE)}
      bDestructiveWarning={true}
      onOK={restore}
    >
      <p>{t(L.RESTORE_CONFIRM)}</p>
      <div style={{ overflowWrap: "break-word", padding: "0 16px", fontSize: "12px" }}>
        {url}
      </div>
    </ConfirmModal>
  );

  return (
    <DialogBody>
      <DialogControlsSection>
        <DialogControlsSectionHeader>
          {t(L.BACKUP_SETTINGS)}
        </DialogControlsSectionHeader>
        <FullWidthFieldScope>
          <Field childrenLayout="below">
            {/* @ts-expect-error */}
            <Focusable style={{
              display: 'flex',
              flexWrap: 'nowrap',
              columnGap: '10px',
            }}>
              <DialogButton
                style={{
                  display: "flex",
                  alignItems: "center",
                  columnGap: '8px',
                }}
                disabled={busy}
                onClick={backup}
              >
                <BsCloudUploadFill /> {t(L.BACKUP)}
              </DialogButton>
              <DialogButton
                style={{
                  display: "flex",
                  alignItems: "center",
                  columnGap: '8px',
                }}
                disabled={busy}
                onClick={confirmRestore}
              >
                <BsCloudDownloadFill /> {t(L.RESTORE)}
              </DialogButton>
            </Focusable>
          </Field>
          <DialogControlsSectionHeader>
            {t(L.WEBDAV_CONFIG)}
          </DialogControlsSectionHeader>
          <Field childrenLayout="below">
            {/* @ts-expect-error */}
            <Focusable style={{
              display: "flex",
              flexDirection: "column",
              rowGap: "10px",
            }}>
              <TextField
                label={t(L.WEBDAV_URL)}
                /* @ts-expect-error */
                placeholder="https://example.com/dav/DeckyClash/settings.zip"
                value={url}
                disabled={busy}
                onChange={(e) => setUrl(e.target.value)}
              />
              <TextField
                label={t(L.WEBDAV_USERNAME)}
                value={username}
                disabled={busy}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                label={t(L.WEBDAV_PASSWORD)}
                value={password}
                /* @ts-expect-error */
                type="password"
                disabled={busy}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Focusable>
          </Field>
          <Field>
            {/* @ts-expect-error */}
            <Focusable style={{
              display: 'flex',
              flexWrap: 'nowrap',
              columnGap: '10px',
            }}>
              <DialogButton
                disabled={busy}
                onClick={testConfig}
              >
                {t(L.TEST)}
              </DialogButton>
              <DialogButton
                disabled={busy}
                onClick={saveConfig}
              >
                {t(L.SAVE)}
              </DialogButton>
            </Focusable>
          </Field>
        </FullWidthFieldScope>
      </DialogControlsSection>
    </DialogBody>
  );
};
