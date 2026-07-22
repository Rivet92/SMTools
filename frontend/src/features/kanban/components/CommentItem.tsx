import { useState } from 'react';
import { Box, Button, IconButton, Paper, TextField, Tooltip, Typography } from '@mui/material';
import { IconEdit, IconSend, IconTrash, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../../../components/room-lobby/ConfirmDialog';
import type { Comment, Participant } from '../store/kanbanStore';

export function CommentItem({
  comment,
  participants,
  ownParticipantId,
  isEditing,
  editContent,
  onEditContentChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: {
  comment: Comment;
  participants: Participant[];
  ownParticipantId: string | undefined;
  isEditing: boolean;
  editContent: string;
  onEditContentChange: (value: string) => void;
  onStartEdit: (comment: Comment) => void;
  onCancelEdit: () => void;
  onSaveEdit: (commentId: string) => void;
  onDelete: (commentId: string) => void;
}) {
  const { t } = useTranslation();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const author = participants.find((p) => p.id === comment.authorParticipantId);
  const canModify = ownParticipantId && comment.authorParticipantId === ownParticipantId;

  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography variant="caption" fontWeight={600}>
          {author?.displayName ?? t('kanban.unknownParticipant')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(comment.createdAt).toLocaleString()}
        </Typography>
        {comment.updatedAt && (
          <Typography variant="caption" color="text.secondary">
            ({t('kanban.edited')})
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        {canModify && !isEditing && (
          <>
            <Tooltip title={t('kanban.edit')}>
              <IconButton
                size="small"
                sx={{ p: 0.25 }}
                onClick={() => onStartEdit(comment)}
                aria-label={t('kanban.aria.editComment')}
              >
                <IconEdit size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('kanban.delete')}>
              <IconButton
                size="small"
                sx={{ p: 0.25 }}
                aria-label={t('kanban.aria.deleteComment')}
                onClick={() => setConfirmDeleteId(comment.id)}
              >
                <IconTrash size={14} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      <ConfirmDialog
        open={confirmDeleteId === comment.id}
        title={t('kanban.delete')}
        message={t('kanban.confirmDeleteComment')}
        confirmLabel={t('kanban.delete')}
        destructive
        onConfirm={() => {
          onDelete(comment.id);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {isEditing ? (
        <Box>
          <TextField
            value={editContent}
            onChange={(e) => onEditContentChange(e.target.value)}
            fullWidth
            multiline
            size="small"
            minRows={2}
            autoFocus
          />
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, justifyContent: 'flex-end' }}>
            <Button
              size="small"
              variant="text"
              onClick={onCancelEdit}
              startIcon={<IconX size={14} />}
            >
              {t('kanban.cancel')}
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => onSaveEdit(comment.id)}
              disabled={!editContent.trim()}
              startIcon={<IconSend size={14} />}
            >
              {t('kanban.save')}
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {comment.content}
        </Typography>
      )}
    </Paper>
  );
}
