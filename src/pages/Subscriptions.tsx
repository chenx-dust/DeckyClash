import { PanelSectionRow, TextField, ButtonItem } from "@decky/ui";
import { useState, FC, useEffect } from "react";
import { cleanPadding } from "../style";
import { SubList } from "../components";
import { QRCodeCanvas } from "qrcode.react";
import { BsExclamationCircleFill } from "react-icons/bs";

import * as backend from "../backend/backend";
import { localizationManager, L } from "../i18n";
import { addEventListener, removeEventListener, toaster } from "@decky/api";

interface SubProp {
  Subscriptions: Record<string, string>;
}

export const Subscriptions: FC<SubProp> = ({ Subscriptions }) => {
  const [text, setText] = useState("");
  const [downloadTips, setDownloadTips] = useState("");
  const [subscriptions, setSubscriptions] = useState(Subscriptions);
  const [downlaodBtnDisable, setDownlaodBtnDisable] = useState(false);
  const [updateBtnDisable, setUpdateBtnDisable] = useState(false);
  const [updateTips, setUpdateTips] = useState("");
  const [QRPageUrl, setQRPageUrl] = useState("");

  useEffect(() => {
    backend.setExternalStatus(true);
    addEventListener("sub_update", refreshSubs);
    return () => {
      backend.setExternalStatus(false);
      removeEventListener("sub_update", refreshSubs);
    };
  }, []);

  const refreshSubs = async () => {
    const subs = await backend.getSubscriptionList();
    setSubscriptions(subs);
  };

  //获取 QR Page
  backend.getExternalURL().then((url) => {
    setQRPageUrl(url);
  })

  return (
    <>
      <style>
        {`
          #subscription-download-textfiled {
              padding: 0px !important
          }
          #subscription-download-textfiled > div {
              margin-bottom: 0px !important
          }
          #subscription-qrcode {
              display: flex;
              justify-content: center;
          }
        `}
      </style>
      <PanelSectionRow>
        <div id="subscription-qrcode">
          <QRCodeCanvas value={QRPageUrl} size={128} />
        </div>
        <p style={{ textAlign: "center" }}>{QRPageUrl}</p>
        <div id="subscription-download-textfiled" style={cleanPadding}>
          <TextField
            label={localizationManager.getString(L.SUBSCRIPTIONS_LINK)}
            value={text}
            onChange={(e) => setText(e?.target.value)}
            description={downloadTips}
          />
        </div>
        <ButtonItem
          layout="below"
          disabled={downlaodBtnDisable}
          onClick={async () => {
            setDownlaodBtnDisable(true);
            const [success, error] = await backend.downloadSubscription(text);
            if (!success) {
              toaster.toast({
                title: localizationManager.getString(L.DOWNLOAD_FAILURE),
                body: error,
                icon: <BsExclamationCircleFill />,
              });
              setDownloadTips(L.DOWNLOAD_FAILURE + ": " + error);
              setTimeout (() => {
                setDownloadTips("");
              }, 5000);
            }
            setDownlaodBtnDisable(false);
            refreshSubs();
          }}
        >
          {localizationManager.getString(L.DOWNLOAD)}
        </ButtonItem>
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
              setUpdateTips(L.UPDATE_FAILURE + ": " + error);
              setTimeout(() => {
                setDownloadTips("");
              }, 5000);
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
