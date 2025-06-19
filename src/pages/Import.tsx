import { useState, FC, useEffect } from "react";
import { TextFieldWithButton } from "../components";
import { QRCodeCanvas } from "qrcode.react";
import { BsCheckCircleFill, BsExclamationCircleFill, BsFillCloudDownloadFill } from "react-icons/bs";
import i18n from "i18next";

import * as backend from "../backend/backend";
import { L } from "../i18n";
import { addEventListener, removeEventListener, toaster } from "@decky/api";

export const Import: FC = () => {
  const [subUrl, setSubUrl] = useState("");
  const [downloadTips, setDownloadTips] = useState("");
  const [downlaodBtnDisable, setDownlaodBtnDisable] = useState(false);
  const [QRPageUrl, setQRPageUrl] = useState("");

  const tipTimeout = 10000;

  useEffect(() => {
    backend.setExternalStatus(true);
    const callback = (name: string) => {
      toaster.toast({
        title: i18n.t(L.DOWNLOAD_SUCCESS),
        body: name,
        icon: <BsCheckCircleFill />,
      });
    };
    addEventListener("sub_update", callback);
    return () => {
      backend.setExternalStatus(false);
      removeEventListener("sub_update", callback);
    };
  }, []);

  useEffect(() => {
    const f = async () => {
      const ip = await backend.getIP();
      const port = await backend.getConfigValue("external_port");
      setQRPageUrl(`http://${ip}:${port}`);
    };
    f();
  }, []);

  return (
    <>
      { QRPageUrl && (
        <div id="subscription-qrcode">
          <QRCodeCanvas style={{
            display: "block",
            margin: "8px auto",
          }} value={QRPageUrl} size={128} />
          <p style={{
            textAlign: "center",
            overflowWrap: "break-word"
          }}>
            {QRPageUrl}
          </p>
        </div>
      ) || (<p style={{
        textAlign: "center",
        overflowWrap: "break-word"
      }}>
        {i18n.t(L.ENABLE_CLASH_LOADING)}
      </p>)}
      <TextFieldWithButton
        label={i18n.t(L.DOWNLOAD_SUBSCRIPTION)}
        description={downloadTips}
        placeholder={i18n.t(L.SUBSCRIPTION_LINK)}
        value={subUrl}
        onChange={(e) => setSubUrl(e?.target.value)}
        disabled={downlaodBtnDisable}
        onClick={async () => {
          setDownlaodBtnDisable(true);
          setDownloadTips(i18n.t(L.DOWNLOADING));
          const [success, error] = await backend.downloadSubscription(subUrl);
          if (!success) {
            toaster.toast({
              title: i18n.t(L.DOWNLOAD_FAILURE),
              body: error,
              icon: <BsExclamationCircleFill />,
            });
            setDownloadTips(i18n.t(L.DOWNLOAD_FAILURE) + ": " + error);
            setTimeout(() => {
              setDownloadTips("");
            }, tipTimeout);
          }
          setDownlaodBtnDisable(false);
        }}
      >
        <BsFillCloudDownloadFill />
      </TextFieldWithButton>
    </>
  );
};
