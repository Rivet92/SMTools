import { Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { GenericDialog } from '../GenericDialog';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <GenericDialog
      open={open}
      onClose={onCancel}
      title={title}
      actions={
        <>
          <Button onClick={onCancel}>{cancelLabel ?? t('common.cancel')}</Button>
          <Button
            variant="contained"
            color={destructive ? 'error' : 'primary'}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </>
      }
    >
      {message}
    </GenericDialog>
  );
}
