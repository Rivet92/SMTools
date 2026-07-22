import { useRef } from 'react';
import { Button, TextField, Stack, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { GenericDialog } from '../../../components/GenericDialog';

export function AddCardDialog({
  open,
  onClose,
  content,
  onContentChange,
  onSubmit,
  error,
  onClearError,
}: {
  open: boolean;
  onClose: () => void;
  content: string;
  onContentChange: (v: string) => void;
  onSubmit: () => void;
  error: string | null;
  onClearError: () => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <GenericDialog
      open={open}
      onClose={onClose}
      title={t('retro.addCard')}
      TransitionProps={{
        onEntered: () => inputRef.current?.focus(),
      }}
      actions={
        <>
          <Button onClick={onClose}>{t('retro.cancel')}</Button>
          <Button variant="contained" onClick={onSubmit} disabled={!content.trim()}>
            {t('retro.addCard')}
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
          multiline
          rows={3}
          placeholder={t('retro.addCardPlaceholder')}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSubmit()}
          fullWidth
        />
      </Stack>
    </GenericDialog>
  );
}
