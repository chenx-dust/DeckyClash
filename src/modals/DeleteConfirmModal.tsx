import { ConfirmModal } from '@decky/ui';
import i18n from 'i18next';
import { FC } from 'react';
import { L } from '../i18n';

interface DeleteConfirmModalProps {
  name: string;
  url: string;
  onOk(): Promise<void>;
  closeModal?(): void;
}

const DeleteConfirmModal: FC<DeleteConfirmModalProps> = (props) => {
  return (
    <ConfirmModal
      closeModal={props.closeModal}
      onOK={props.onOk}
      strTitle={i18n.t(L.DELETE_SUBSCRIPTION)}
      strOKButtonText={i18n.t(L.DELETE)}
      bDestructiveWarning={true}
    >
      <p>
        {i18n.t(L.DELETE_CONFIRM)}
      </p>
      <div style={{ padding: "0 16px" }}>
        <b>{props.name}</b>
      </div>
      <div style={{
        overflowWrap: "break-word",
        padding: "0 16px",
        fontSize: "12px",
      }}>
        {props.url}
      </div>
    </ConfirmModal>
  );
};

export default DeleteConfirmModal;