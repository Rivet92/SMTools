import { useRef, useState, useCallback } from 'react';
import { Button, TextField, Stack, Alert, Typography, CircularProgress } from '@mui/material';
import { GenericDialog } from '../GenericDialog';
import { useTranslation } from 'react-i18next';

export function PasswordSettingsDialog({
  open,
  hasPassword,
  onClose,
  onSubmit,
  error,
  onClearError,
  keyPrefix = 'planningPoker',
}: {
  open: boolean;
  hasPassword: boolean;
  onClose: () => void;
  onSubmit: (password: string | null) => Promise<void>;
  error: string | null;
  onClearError: () => void;
  keyPrefix?: string;
}) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleEntered = useCallback(() => {
    passwordInputRef.current?.focus();
  }, []);

  const handleExited = useCallback(() => {
    setPassword('');
    setIsSubmitting(false);
  }, []);

  const handleClose = () => {
    onClearError();
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(password.trim() || null);
      handleClose();
    } catch {
      // Error is handled by the parent hook via actionError
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GenericDialog
      open={open}
      onClose={handleClose}
      title={hasPassword ? t(`${keyPrefix}.passwordChange`) : t(`${keyPrefix}.passwordSet`)}
      TransitionProps={{ onEntered: handleEntered, onExited: handleExited }}
      actions={
        <>
          <Button onClick={handleClose} disabled={isSubmitting}>
            {t(`${keyPrefix}.cancel`)}
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <CircularProgress size={20} />
            ) : hasPassword ? (
              t(`${keyPrefix}.passwordChange`)
            ) : (
              t(`${keyPrefix}.passwordSet`)
            )}
          </Button>
        </>
      }
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        {error && (
          <Alert severity="error" onClose={onClearError}>
            {error}
          </Alert>
        )}
        <Typography variant="body2" color="text.secondary">
          {hasPassword ? t(`${keyPrefix}.passwordSetNew`) : t(`${keyPrefix}.passwordOptional`)}
        </Typography>
        <TextField
          label={t(`${keyPrefix}.passwordLabel`)}
          inputRef={passwordInputRef}
          autoFocus
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={isSubmitting}
          fullWidth
        />
      </Stack>
    </GenericDialog>
  );
}
