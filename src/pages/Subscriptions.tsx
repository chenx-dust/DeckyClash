import { PanelSectionRow, ButtonItem } from "@decky/ui";
import { useState, FC, useEffect } from "react";
import { SubList, TextFieldWithButton } from "../components";
import { QRCodeCanvas } from "qrcode.react";
import { BsCheckCircleFill, BsExclamationCircleFill, BsFillCloudDownloadFill } from "react-icons/bs";

import * as backend from "../backend/backend";
import { localizationManager, L } from "../i18n";
import { addEventListener, removeEventListener, toaster } from "@decky/api";

interface SubProp {
  Subscriptions: Record<string, string>;
}

export const Subscriptions: FC<SubProp> = ({ Subscriptions }) => {
  const [subUrl, setSubUrl] = useState("");
  const [downloadTips, setDownloadTips] = useState("");
  const [subscriptions, setSubscriptions] = useState(Subscriptions);
  const [downlaodBtnDisable, setDownlaodBtnDisable] = useState(false);
  const [updateBtnDisable, setUpdateBtnDisable] = useState(false);
  const [updateTips, setUpdateTips] = useState("");
  const [QRPageUrl, setQRPageUrl] = useState("");

  const tipTimeout = 10000;

  useEffect(() => {
    backend.setExternalStatus(true);
    const callback = (name: string) => {
      toaster.toast({
        title: localizationManager.getString(L.DOWNLOAD_SUCCESS),
        body: name,
        icon: <BsCheckCircleFill />,
      });
      refreshSubs();
    };
    addEventListener("sub_update", callback);
    return () => {
      backend.setExternalStatus(false);
      removeEventListener("sub_update", callback);
    };
  }, []);

  const refreshSubs = async () => {
    const subs = await backend.getSubscriptionList();
    setSubscriptions(subs);
  };

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
      <PanelSectionRow>
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
          {localizationManager.getString(L.ENABLE_CLASH_LOADING)}
        </p>)}
        <TextFieldWithButton
          label={localizationManager.getString(L.DOWNLOAD_SUBSCRIPTION)}
          description={downloadTips}
          placeholder={localizationManager.getString(L.SUBSCRIPTION_LINK)}
          value={subUrl}
          onChange={(e) => setSubUrl(e?.target.value)}
          disabled={downlaodBtnDisable}
          onClick={async () => {
            setDownlaodBtnDisable(true);
            setDownloadTips(localizationManager.getString(L.DOWNLOADING));
            const [success, error] = await backend.downloadSubscription(subUrl);
            if (!success) {
              toaster.toast({
                title: localizationManager.getString(L.DOWNLOAD_FAILURE),
                body: error,
                icon: <BsExclamationCircleFill />,
              });
              setDownloadTips(localizationManager.getString(L.DOWNLOAD_FAILURE) + ": " + error);
              setTimeout(() => {
                setDownloadTips("");
              }, tipTimeout);
            }
            setDownlaodBtnDisable(false);
            refreshSubs();
          }}
        >
          <BsFillCloudDownloadFill />
        </TextFieldWithButton>
        <ButtonItem
          layout="below"
          description={updateTips}
          onClick={async () => {
            setUpdateBtnDisable(true);
            setUpdateTips(localizationManager.getString(L.UPDATING));
            const failed = await backend.updateAllSubscriptions();
            if (failed.length > 0) {
              const error = failed.map((x) => `${x[0]}: ${x[1]}`).join("\n");
              toaster.toast({
                title: localizationManager.getString(L.UPDATE_FAILURE),
                body: error,
                icon: <BsExclamationCircleFill />,
              });
              setUpdateTips(localizationManager.getString(L.UPDATE_FAILURE) + ": " + error);
              setTimeout(() => {
                setUpdateTips("");
              }, tipTimeout);
            } else {
              setUpdateTips(localizationManager.getString(L.UPDATE_SUCCESS));
              setTimeout(() => {
                setUpdateTips("");
              }, tipTimeout);
            }
            setUpdateBtnDisable(false);
          }}
          disabled={updateBtnDisable || Object.entries(subscriptions).length == 0}
        >
          {localizationManager.getString(L.UPDATE_ALL)}
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        <SubList
          Subscriptions={subscriptions}
          Refresh={refreshSubs}
        ></SubList>
      </PanelSectionRow>
    </>
  );
};
