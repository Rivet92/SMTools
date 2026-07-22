import {
  Button,
  TextField,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { GenericDialog } from '../../../components/GenericDialog';
import type { RetroParticipant } from '../../../types/models/retro';

export function AddActionItemDialog({
  open,
  onClose,
  content,
  onContentChange,
  assigneeId,
  onAssigneeChange,
  onSubmit,
  participants,
  error,
  onClearError,
}: {
  open: boolean;
  onClose: () => void;
  content: string;
  onContentChange: (v: string) => void;
  assigneeId: string | '';
  onAssigneeChange: (v: string | '') => void;
  onSubmit: () => void;
  participants: RetroParticipant[];
  error: string | null;
  onClearError: () => void;
}) {
  const { t } = useTranslation();

  return (
    <GenericDialog
      open={open}
      onClose={onClose}
      title={t('retro.addActionItem')}
      actions={
        <>
          <Button onClick={onClose}>{t('retro.cancel')}</Button>
          <Button variant="contained" onClick={onSubmit} disabled={!content.trim()}>
            {t('retro.addActionItem')}
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
          autoFocus
          multiline
          rows={3}
          placeholder={t('retro.actionItemPlaceholder')}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSubmit()}
          fullWidth
        />
        <FormControl fullWidth>
          <InputLabel>{t('retro.assignTo')}</InputLabel>
          <Select
            value={assigneeId}
            label={t('retro.assignTo')}
            onChange={(e) => onAssigneeChange(e.target.value as string)}
          >
            <MenuItem value="">
              <em>{t('retro.unassigned')}</em>
            </MenuItem>
            {participants.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.displayName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </GenericDialog>
  );
}
