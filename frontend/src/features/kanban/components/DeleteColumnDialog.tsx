import { Button, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { GenericDialog } from '../../../components/GenericDialog';
import type { Column } from '../store/kanbanStore';

export function DeleteColumnDialog({
  deleteCandidate,
  targetColumnId,
  onTargetColumnIdChange,
  onConfirm,
  onCancel,
  candidateCardCount,
  otherColumns,
  pendingColumnId,
}: {
  deleteCandidate: Column | null;
  targetColumnId: string;
  onTargetColumnIdChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  candidateCardCount: number;
  otherColumns: Column[];
  pendingColumnId: string | null;
}) {
  const { t } = useTranslation();

  return (
    <GenericDialog
      open={deleteCandidate !== null}
      onClose={onCancel}
      title={t('kanban.deleteColumn')}
      actions={
        <>
          <Button onClick={onCancel}>{t('kanban.cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={onConfirm}
            disabled={pendingColumnId === deleteCandidate?.id}
          >
            {t('kanban.delete')}
          </Button>
        </>
      }
    >
      <Typography variant="body2" sx={{ mb: 2 }}>
        {t('kanban.deleteColumnConfirm', { title: deleteCandidate?.title ?? '' })}
      </Typography>

      {candidateCardCount > 0 && (
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {t('kanban.deleteColumnCards', { count: candidateCardCount })}
          </Typography>
          <TextField
            select
            label={t('kanban.moveCardsTo')}
            value={targetColumnId}
            onChange={(e) => onTargetColumnIdChange(e.target.value)}
            size="small"
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="">{t('kanban.deleteCards')}</option>
            {otherColumns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </TextField>
        </Stack>
      )}
    </GenericDialog>
  );
}
