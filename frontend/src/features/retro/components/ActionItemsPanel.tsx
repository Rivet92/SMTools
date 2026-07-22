import { Box, Typography, Paper, Stack, Chip, IconButton, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { IconTrash } from '@tabler/icons-react';
import type { RetroActionItem, RetroParticipant } from '../../../types/models/retro';

export function ActionItemsPanel({
  actionItems,
  participants,
  isAdmin,
  onAdd,
  onDelete,
}: {
  actionItems: RetroActionItem[];
  participants: RetroParticipant[];
  isAdmin: boolean;
  onAdd: () => void;
  onDelete: (actionItemId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Paper
      variant="outlined"
      sx={{ width: 320, minWidth: 320, display: 'flex', flexDirection: 'column', borderRadius: 0 }}
    >
      <Box
        sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="subtitle2">{t('retro.actionItems')}</Typography>
        {isAdmin && (
          <Button size="small" onClick={onAdd}>
            {t('retro.addActionItem')}
          </Button>
        )}
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {actionItems.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            {t('retro.noActionItems')}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {actionItems.map((item) => (
              <ActionItemRow
                key={item.id}
                actionItem={item}
                participants={participants}
                isAdmin={isAdmin}
                onDelete={onDelete}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}

function ActionItemRow({
  actionItem,
  participants,
  isAdmin,
  onDelete,
}: {
  actionItem: RetroActionItem;
  participants: RetroParticipant[];
  isAdmin: boolean;
  onDelete: (actionItemId: string) => void;
}) {
  const { t } = useTranslation();
  const assignee = actionItem.assigneeParticipantId
    ? participants.find((p) => p.id === actionItem.assigneeParticipantId)
    : null;

  return (
    <Box
      sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}
    >
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 0.5 }}>
        {actionItem.content}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Chip
          label={assignee ? assignee.displayName : t('retro.unassigned')}
          size="small"
          variant="outlined"
          color={assignee ? 'primary' : 'default'}
        />
        {isAdmin && (
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(actionItem.id)}
            aria-label={t('retro.aria.deleteActionItem')}
          >
            <IconTrash size={16} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}
