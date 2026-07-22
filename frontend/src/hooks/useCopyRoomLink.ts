import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from '../components/feedback/SnackbarProvider';

export function useCopyRoomLink() {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const copyLink = useCallback(
    async (roomId: string, roomRoute: (id: string) => string) => {
      const url = `${window.location.origin}${roomRoute(roomId)}`;
      try {
        await navigator.clipboard.writeText(url);
        enqueueSnackbar({ message: t('common.copied'), severity: 'success' });
      } catch {
        enqueueSnackbar({ message: t('common.copyFailed'), severity: 'error' });
      }
    },
    [enqueueSnackbar, t],
  );

  return { copyLink };
}
