import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../components/feedback/SnackbarProvider';

export function useRoomClosedSnackbar(
  roomClosedMessage: string | null,
  setRoomClosedMessage: (msg: string | null) => void,
  navigateTo: string,
) {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    if (roomClosedMessage) {
      enqueueSnackbar({
        message: roomClosedMessage,
        severity: 'info',
        autoHideDuration: 3500,
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        onClose: () => navigate(navigateTo),
      });
      setRoomClosedMessage(null);
    }
  }, [roomClosedMessage, enqueueSnackbar, navigate, setRoomClosedMessage, navigateTo]);
}
