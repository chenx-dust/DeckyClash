import { ConfirmModal, TextField } from '@decky/ui';
import i18n from 'i18next';
import { FC, useState } from 'react';
import { L } from '../i18n';

interface EditSubscriptionModalProps {
  name: string;
  url: string;
  onOk(name: string, url: string): Promise<void>;
  closeModal?(): void;
  checkName(name: string): string;
}

const EditSubscriptionModal: FC<EditSubscriptionModalProps> = (props) => {
  const [name, setName] = useState(props.name);
  const [url, setUrl] = useState(props.url);
  const [nameInvalid, setNameInvalid] = useState(false);
  const [nameWarning, setNameWarning] = useState("");

  return (
    <ConfirmModal
      closeModal={props.closeModal}
      bOKDisabled={nameInvalid}
      onOK={async () => {
        await props.onOk(name, url);
      }}
      strTitle={i18n.t(L.EDIT_SUBSCRIPTION)}
    >
      <TextField
        label={i18n.t(L.NAME)}
        value={name}
        onChange={(e) => {
          setName(e?.target.value);
          const result = props.checkName(e?.target.value);
          setNameInvalid(result != "");
          setNameWarning(result);
        }}
        description={<div style={{ color: "red" }}>
          {nameWarning}
        </div>}
      />
      <TextField
        label={i18n.t(L.LINK)}
        value={url}
        mustBeURL={true}
        onChange={(e) => setUrl(e?.target.value)}
      />
    </ConfirmModal>
  );
};

export default EditSubscriptionModal;