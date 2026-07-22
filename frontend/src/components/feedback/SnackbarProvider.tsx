/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import { Snackbar, Alert, type AlertColor, type SnackbarOrigin } from '@mui/material';

interface SnackbarMessage {
  id: string;
  message: string;
  severity?: AlertColor;
  autoHideDuration?: number;
  anchorOrigin?: SnackbarOrigin;
  onClose?: () => void;
}

interface SnackbarContextValue {
  enqueueSnackbar: (msg: Omit<SnackbarMessage, 'id'>) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<SnackbarMessage[]>([]);

  const enqueueSnackbar = useCallback((msg: Omit<SnackbarMessage, 'id'>) => {
    const id = crypto.randomUUID();
    setQueue((prev) => [...prev, { ...msg, id }]);
  }, []);

  const handleClose = useCallback((id: string) => {
    setQueue((prev) => {
      const item = prev.find((m) => m.id === id);
      item?.onClose?.();
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  const current = queue[0];

  return (
    <SnackbarContext.Provider value={{ enqueueSnackbar }}>
      {children}
      {current && (
        <Snackbar
          key={current.id}
          open
          autoHideDuration={current.autoHideDuration}
          onClose={() => handleClose(current.id)}
          anchorOrigin={current.anchorOrigin}
          message={current.severity ? undefined : current.message}
        >
          {current.severity ? (
            <Alert severity={current.severity} onClose={() => handleClose(current.id)}>
              {current.message}
            </Alert>
          ) : undefined}
        </Snackbar>
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider');
  return ctx;
}
