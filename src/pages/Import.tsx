import { useState, FC, useEffect, useLayoutEffect } from "react";
import { TextFieldWithButton } from "../components";
import { QRCodeCanvas } from "qrcode.react";
import { BsFillCloudDownloadFill } from "react-icons/bs";
import i18n from "i18next";

import { backend } from "../backend";
import { L } from "../i18n";
import { DialogBody, DialogControlsSection, DialogControlsSectionHeader, Field, ToggleField } from "@decky/ui";
import { TIPS_TIMEOUT } from "../global";

interface ExternalImporterConfig {
  url: string;
  enabled: boolean;
  background: boolean;
}

export const Import: FC = () => {
  const localConfig = JSON.parse(window.localStorage.getItem("decky-clash-external-importer") ||
    JSON.stringify({
      url: "",
      enabled: false,
      background: false,
    } as ExternalImporterConfig)
  );

  const [subUrl, setSubUrl] = useState("");
  const [downloadTips, setDownloadTips] = useState(i18n.t(L.DOWNLOAD_DESC));
  const [downloading, setDownloading] = useState(false);
  const [externalUrl, setExternalUrl] = useState(localConfig.url);
  const [enableExImporter, setEnableExImporter] = useState(localConfig.enabled);
  const [bgExImporter, setBgExImporter] = useState(localConfig.background);
  const [initialized, setInitialized] = useState(false);

  const fetchUrl = async () => {
    const ip = await backend.getIP();
    const port = await backend.getConfigValue("external_port");
    setExternalUrl(`http://${ip}:${port}`);
  };

  useLayoutEffect(() => {
    Promise.all([
      fetchUrl(),
      backend.getConfigValue("external_run_bg").then((value: boolean) => {
        setBgExImporter(value);
        if (value)
          setEnableExImporter(true);
      }),
    ]).then(() => setInitialized(true));
  }, []);

  useEffect(() => {
    if (initialized) {
      window.localStorage.setItem("decky-clash-external-importer", JSON.stringify({
        url: externalUrl,
        enabled: enableExImporter,
        background: bgExImporter,
      } as ExternalImporterConfig));
    }
  }, [initialized, externalUrl, enableExImporter, bgExImporter]);

  useLayoutEffect(() => {
    backend.setExternalStatus(enableExImporter);
    return () => {
      if (enableExImporter)
        setBgExImporter((x: boolean) => {
          // get latest value to avoid conflict
          if (!x)
            backend.setExternalStatus(false);
          return x;
        })
    };
  }, [enableExImporter, bgExImporter]);

  useLayoutEffect(() => {
    if (initialized && enableExImporter)
      fetchUrl();
  }, [initialized, enableExImporter]);

  useEffect(() => {
    if (!downloading && downloadTips != i18n.t(L.DOWNLOAD_DESC)) {
      const timer = setTimeout(() => {
        setDownloadTips(i18n.t(L.DOWNLOAD_DESC));
      }, TIPS_TIMEOUT);
      return () => clearTimeout(timer);
    }
    return;
  }, [downloadTips, downloading]);

  const changeRunInBackground = (x: boolean) => {
    setBgExImporter(x);
    backend.setConfigValue("external_run_bg", x).then(() =>
      backend.getConfigValue("external_run_bg").then(setBgExImporter));
  };

  return (
    <DialogBody>
      <DialogControlsSection>
        <DialogControlsSectionHeader>
          {i18n.t(L.DOWNLOAD_SUBSCRIPTION)}
        </DialogControlsSectionHeader>
        <TextFieldWithButton
          description={downloadTips}
          placeholder={i18n.t(L.SUBSCRIPTION_LINK)}
          value={subUrl}
          onChange={(e) => setSubUrl(e?.target.value)}
          disabled={downloading}
          onClick={async () => {
            setDownloading(true);
            setDownloadTips(i18n.t(L.DOWNLOADING));
            const [success, error] = await backend.downloadSubscription(subUrl);
            if (!success) {
              setDownloadTips(i18n.t(L.DOWNLOAD_FAILURE) + ": " + error);
            } else {
              setDownloadTips(i18n.t(L.DOWNLOAD_SUCCESS));
            }
            setDownloading(false);
          }}
        >
          <BsFillCloudDownloadFill />
        </TextFieldWithButton>
      </DialogControlsSection>
      <DialogControlsSection>
        <DialogControlsSectionHeader>
          {i18n.t(L.EXTERNAL_IMPORTER)}
        </DialogControlsSectionHeader>
        <ToggleField
          label={i18n.t(L.ENABLE)}
          checked={enableExImporter}
          onChange={(x) => {
            setEnableExImporter(x);
            if (!x)
              changeRunInBackground(false);
          }}
        />
        {enableExImporter && <>
          <ToggleField
            label={i18n.t(L.RUN_IN_BACKGROUND)}
            checked={bgExImporter}
            onChange={changeRunInBackground}
          />
          {externalUrl && (
            <Field
              focusable={true}
              label={
                <div style={{
                  flexGrow: 1,
                  textAlign: "center",
                  overflowWrap: "break-word"
                }}>
                  {externalUrl && (
                    <QRCodeCanvas style={{
                      display: "block",
                      margin: "8px auto",
                    }} value={externalUrl} size={128} />
                  )}
                  {externalUrl || i18n.t(L.ENABLE_CLASH_LOADING)}
                </div>
              } />
          )}
        </>}
      </DialogControlsSection>
    </DialogBody>
  );
};
