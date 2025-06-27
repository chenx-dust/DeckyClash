import { ConfirmModal } from '@decky/ui';
import { t } from 'i18next';
import { FC } from 'react';
import { L } from '../i18n';

interface DeleteConfirmModalProps {
  name: string;
  url: string;
  onOk(): Promise<void>;
  closeModal?(): void;
}

export const DeleteConfirmModal: FC<DeleteConfirmModalProps> = (props) => {
  return (
    <ConfirmModal
      closeModal={props.closeModal}
      onOK={props.onOk}
      strTitle={t(L.DELETE_SUBSCRIPTION)}
      strOKButtonText={t(L.DELETE)}
      bDestructiveWarning={true}
    >
      <p>
        {t(L.DELETE_CONFIRM)}
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
