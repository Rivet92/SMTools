import { Button, Typography } from '@mui/material';
import { GenericDialog } from '../GenericDialog';
import { useTranslation } from 'react-i18next';

interface KickConfirmDialogProps {
  open: boolean;
  participantName: string;
  featureKey: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function KickConfirmDialog({
  open,
  participantName,
  featureKey,
  onConfirm,
  onCancel,
}: KickConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <GenericDialog
      open={open}
      onClose={onCancel}
      title={t(`${featureKey}.removeParticipantTitle`)}
      actions={
        <>
          <Button onClick={onCancel}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" onClick={onConfirm}>
            {t(`${featureKey}.removeParticipant`)}
          </Button>
        </>
      }
    >
      <Typography variant="body2" color="text.secondary">
        {t(`${featureKey}.removeParticipantConfirm`, { name: participantName })}
      </Typography>
    </GenericDialog>
  );
}
