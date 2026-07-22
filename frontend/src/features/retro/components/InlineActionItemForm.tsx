import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { IconTrash, IconUser, IconUserOff } from '@tabler/icons-react';
import type { RetroActionItem, RetroParticipant } from '../../../types/models/retro';

export function InlineActionItemForm({
  actionItems,
  participants,
  isAdmin,
  content,
  onContentChange,
  assigneeId,
  onAssigneeChange,
  onSubmit,
  onDelete,
  onAssign,
  error,
  onClearError,
}: {
  actionItems: RetroActionItem[];
  participants: RetroParticipant[];
  isAdmin: boolean;
  content: string;
  onContentChange: (v: string) => void;
  assigneeId: string;
  onAssigneeChange: (v: string) => void;
  onSubmit: () => void;
  onDelete: (actionItemId: string) => void;
  onAssign: (actionItemId: string, assigneeParticipantId: string | null) => void;
  error: string | null;
  onClearError: () => void;
}) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          {t('retro.actionItems')}
        </Typography>

        <Stack spacing={1.5}>
          <TextField
            multiline
            rows={3}
            size="small"
            placeholder={t('retro.actionItemPlaceholder')}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            fullWidth
            error={!!error}
            helperText={error}
            onFocus={onClearError}
          />

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <AssigneeButton
              assigneeParticipantId={assigneeId || null}
              participants={participants}
              onSelect={(id) => onAssigneeChange(id ?? '')}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              sx={{ ml: 'auto' }}
            >
              {t('retro.addActionItem')}
            </Button>
          </Box>
        </Stack>
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
                onAssign={onAssign}
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
  onAssign,
}: {
  actionItem: RetroActionItem;
  participants: RetroParticipant[];
  isAdmin: boolean;
  onDelete: (actionItemId: string) => void;
  onAssign: (actionItemId: string, assigneeParticipantId: string | null) => void;
}) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}
    >
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 0.5 }}>
        {actionItem.content}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <AssigneeButton
          assigneeParticipantId={actionItem.assigneeParticipantId}
          participants={participants}
          onSelect={(id) => onAssign(actionItem.id, id)}
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

function AssigneeButton({
  assigneeParticipantId,
  participants,
  onSelect,
}: {
  assigneeParticipantId: string | null;
  participants: RetroParticipant[];
  onSelect: (assigneeParticipantId: string | null) => void;
}) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const assignee = assigneeParticipantId
    ? (participants.find((p) => p.id === assigneeParticipantId) ?? null)
    : null;

  return (
    <>
      <IconButton
        size="small"
        aria-label={t('retro.aria.assignParticipant')}
        aria-haspopup="menu"
        onClick={(e) => setAnchorEl(e.currentTarget as HTMLElement)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          borderRadius: 1,
          px: 0.5,
          py: 0.25,
          '&:hover': { bgcolor: 'action.hover', boxShadow: 1 },
        }}
      >
        {assignee ? <IconUser size={14} /> : <IconUserOff size={14} />}
        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.25 }}>
          {assignee ? assignee.displayName : t('retro.unassigned')}
        </Typography>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        onClick={() => setAnchorEl(null)}
      >
        {assignee && (
          <MenuItem onClick={() => onSelect(null)}>
            <IconUserOff size={16} style={{ marginRight: 8 }} />
            {t('retro.unassigned')}
          </MenuItem>
        )}
        {participants
          .filter((p) => p.isConnected)
          .map((p) => (
            <MenuItem
              key={p.id}
              selected={p.id === assigneeParticipantId}
              onClick={() => onSelect(p.id)}
            >
              <IconUser size={16} style={{ marginRight: 8 }} />
              {p.displayName}
            </MenuItem>
          ))}
      </Menu>
    </>
  );
}
