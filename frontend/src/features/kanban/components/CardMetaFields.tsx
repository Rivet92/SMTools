import { Box, MenuItem, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { RepoUrlPreview } from './RepoUrlPreview';
import type { Participant } from '../store/kanbanStore';

export function CardMetaFields({
  isEditing,
  repoUrl,
  repoBranch,
  assignedParticipantId,
  initialEstimation,
  remaining,
  dueAt,
  participants,
  onRepoUrlChange,
  onRepoBranchChange,
  onAssignedChange,
  onInitialEstimationChange,
  onRemainingChange,
  onDueAtChange,
  isValidUrl,
}: {
  isEditing: boolean;
  repoUrl: string;
  repoBranch: string;
  assignedParticipantId: string;
  initialEstimation: string;
  remaining: string;
  dueAt: string;
  participants: Participant[];
  onRepoUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRepoBranchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAssignedChange: (value: string) => void;
  onInitialEstimationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemainingChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDueAtChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isValidUrl: (url: string) => boolean;
}) {
  const { t } = useTranslation();

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {isEditing ? (
          <>
            <TextField
              label={t('kanban.repoUrlLabel')}
              value={repoUrl}
              onChange={onRepoUrlChange}
              type="url"
              size="small"
              sx={{ flex: 2 }}
            />
            <TextField
              label={t('kanban.repoBranchLabel')}
              value={repoBranch}
              onChange={onRepoBranchChange}
              size="small"
              sx={{ flex: 1 }}
            />
          </>
        ) : (
          <>
            {repoUrl.trim() && isValidUrl(repoUrl) ? (
              <Box sx={{ flex: 2 }}>
                <RepoUrlPreview value={repoUrl} />
              </Box>
            ) : (
              <TextField
                label={t('kanban.repoUrlLabel')}
                value={repoUrl}
                disabled
                size="small"
                sx={{ flex: 2 }}
              />
            )}
            <TextField
              label={t('kanban.repoBranchLabel')}
              value={repoBranch}
              disabled
              size="small"
              sx={{ flex: 1 }}
            />
          </>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {isEditing ? (
          <>
            <TextField
              select
              label={t('kanban.assignedLabel')}
              value={assignedParticipantId}
              onChange={(e) => onAssignedChange(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              SelectProps={{
                MenuProps: {
                  anchorOrigin: { vertical: 'top', horizontal: 'left' },
                  transformOrigin: { vertical: 'bottom', horizontal: 'left' },
                },
              }}
            >
              <MenuItem value="">
                <Typography sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  {t('kanban.unassigned')}
                </Typography>
              </MenuItem>
              {participants.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.displayName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t('kanban.initialEstimationLabel')}
              value={initialEstimation}
              onChange={onInitialEstimationChange}
              type="text"
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              label={t('kanban.remainingLabel')}
              value={remaining}
              onChange={onRemainingChange}
              type="text"
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              label={t('kanban.dueAtLabel')}
              value={dueAt}
              onChange={onDueAtChange}
              type="date"
              size="small"
              slotProps={{ htmlInput: { inputMode: 'date' }, inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </>
        ) : (
          <>
            <TextField
              label={t('kanban.assignedLabel')}
              value={
                assignedParticipantId
                  ? (participants.find((p) => p.id === assignedParticipantId)?.displayName ??
                    t('kanban.unassigned'))
                  : t('kanban.unassigned')
              }
              disabled
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              label={t('kanban.initialEstimationLabel')}
              value={initialEstimation}
              disabled
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              label={t('kanban.remainingLabel')}
              value={remaining}
              disabled
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              label={t('kanban.dueAtLabel')}
              value={dueAt}
              disabled
              size="small"
              slotProps={{ htmlInput: { inputMode: 'date' }, inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </>
        )}
      </Box>
    </>
  );
}
