import { useEffect } from 'react';
import { useSnackbar } from '../components/feedback/SnackbarProvider';

export function useSnackbarError(
  error: string | null,
  clearError: () => void,
  options?: { autoHideDuration?: number },
) {
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (error) {
      enqueueSnackbar({
        message: error,
        severity: 'error',
        autoHideDuration: options?.autoHideDuration ?? 6000,
      });
      clearError();
    }
  }, [error, enqueueSnackbar, clearError, options?.autoHideDuration]);
}
