import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="pms-btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={tone === 'danger' ? 'pms-btn-danger' : 'pms-btn-primary'}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3.5 text-sm text-slate-600 dark:text-slate-300">
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            tone === 'danger'
              ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
              : 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400'
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
};
