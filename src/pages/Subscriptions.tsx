import { PanelSectionRow, TextField, ButtonItem } from "@decky/ui";
import { useReducer, useState, FC } from "react";
import { cleanPadding } from "../style";
import { SubList } from "../components";
import { QRCodeCanvas } from "qrcode.react";

import * as backend from "../backend/backend";
import { localizationManager, L } from "../i18n";
import { toaster } from "@decky/api";

interface SubProp {
  Subscriptions: Record<string, string>;
}

export const Subscriptions: FC<SubProp> = ({ Subscriptions }) => {
  const [text, setText] = useState("");
  const [downloadTips, setDownloadTips] = useState("");
  const [subscriptions, updateSubscriptions] = useState(Subscriptions);
  const [downlaodBtnDisable, setDownlaodBtnDisable] = useState(false);
  const [updateBtnDisable, setUpdateBtnDisable] = useState(false);
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);
  const [updateTips, setUpdateTips] = useState("");
  const [QRPageUrl, setQRPageUrl] = useState("");


  const refreshSubs = async () => {
    const subs = await backend.getSubscriptionList();
    updateSubscriptions(subs);
  };

  //获取 QR Page
  backend.getExternalURL().then((url) => {
    setQRPageUrl(url);
  })

  console.log("load Subs page");

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
            if (!success)
              toaster.toast({
                title: localizationManager.getString(L.DOWNLOAD_FAILURE),
                body: error,
              });
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
            const failed = await backend.updateAllSubscriptions();
            if (failed.length > 0) {
              toaster.toast({
                title: localizationManager.getString(L.UPDATE_FAILURE),
                body: failed.map((x) => `${x[0]}: ${x[1]}`).join("\n"),
              });
            }
            setUpdateBtnDisable(false);
          }}
          disabled={updateBtnDisable || Object.entries(subscriptions).length == 0}
        >
          {localizationManager.getString(L.UPDATE_ALL)}
        </ButtonItem>
      </PanelSectionRow>
      <PanelSectionRow>
        {/* {
                    subscriptions.map(x => {
                        return (
                            <div>
                                <ButtonItem label={x.name} description={x.url} onClick={
                                    () => {
                                        //删除订阅
                                    }
                                }>Delete</ButtonItem>
                            </div>
                        );
                    })
                } */}
        <SubList
          Subscriptions={subscriptions}
          UpdateSub={updateSubscriptions}
          Refresh={forceUpdate}
        ></SubList>
      </PanelSectionRow>
    </>
  );
};
