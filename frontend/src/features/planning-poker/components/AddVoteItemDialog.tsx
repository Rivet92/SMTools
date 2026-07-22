import { useState, useRef, useCallback } from 'react';
import { Button, TextField, Alert, Stack, CircularProgress } from '@mui/material';
import { GenericDialog } from '../../../components/GenericDialog';
import { useTranslation } from 'react-i18next';

export function AddVoteItemDialog({
  open,
  onClose,
  onSubmit,
  error,
  onClearError,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
  error: string | null;
  onClearError: () => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEntered = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleExited = useCallback(() => {
    setTitle('');
    setIsSubmitting(false);
  }, []);

  const handleClose = () => {
    onClearError();
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
      handleClose();
    } catch {
      // El error ya se maneja en el hook padre (actionError)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GenericDialog
      open={open}
      onClose={handleClose}
      title={t('planningPoker.addItem')}
      TransitionProps={{ onEntered: handleEntered, onExited: handleExited }}
      actions={
        <>
          <Button onClick={handleClose} disabled={isSubmitting}>
            {t('planningPoker.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={20} /> : t('planningPoker.create')}
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
        <TextField
          inputRef={inputRef}
          autoFocus
          label={t('planningPoker.itemTitlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={isSubmitting}
          fullWidth
        />
      </Stack>
    </GenericDialog>
  );
}
