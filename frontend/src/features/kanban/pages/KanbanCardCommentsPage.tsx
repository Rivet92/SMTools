import { useCallback, useMemo, useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { PageHead } from '../../seo/components/PageHead';
import { PageHeader } from '../../../components/PageHeader';
import { useKanbanRoomData } from '../hooks/useKanbanRoomData';
import { useKanbanStore } from '../store/kanbanStore';
import { RoomLoadingState } from '../../../components/room-lobby/RoomLoadingState';
import { CommentItem } from '../components/CommentItem';
import { CommentForm } from '../components/CommentForm';
import { addComment, updateComment, deleteComment } from '../kanbanHub';
import type { Comment } from '../store/kanbanStore';

export function KanbanCardCommentsPage() {
  const { t } = useTranslation();
  const { roomId, cardId } = useParams<{ roomId: string; cardId: string }>();
  const setRoom = useKanbanStore((s) => s.setRoom);

  const { room } = useKanbanRoomData();

  const card = useMemo(() => {
    if (!room || !cardId) return null;
    return room.cards.find((c) => c.id === cardId) ?? null;
  }, [room, cardId]);

  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const ownParticipantId = room?.ownParticipantId;

  const handleAdd = useCallback(async () => {
    const trimmed = newComment.trim();
    if (!trimmed || !cardId) return;
    setError(null);
    try {
      const result = await addComment(cardId, trimmed);
      setRoom(result);
      setNewComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.unknownError'));
    }
  }, [newComment, cardId, setRoom, t]);

  const handleStartEdit = useCallback((comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingCommentId(null);
    setEditContent('');
  }, []);

  const handleSaveEdit = useCallback(
    async (commentId: string) => {
      const trimmed = editContent.trim();
      if (!trimmed || !cardId) return;
      setError(null);
      try {
        const result = await updateComment(cardId, commentId, trimmed);
        setRoom(result);
        setEditingCommentId(null);
        setEditContent('');
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.unknownError'));
      }
    },
    [editContent, cardId, setRoom, t],
  );

  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!cardId) return;
      setError(null);
      try {
        const result = await deleteComment(cardId, commentId);
        setRoom(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.unknownError'));
      }
    },
    [cardId, setRoom, t],
  );

  if (!room) {
    return (
      <>
        <PageHead title={t('seo.kanban.title')} description={t('seo.kanban.description')} />
        <RoomLoadingState seoTitleKey="seo.kanban.title" seoDescriptionKey="seo.kanban.description" connectingKey="kanban.connecting" />
      </>
    );
  }

  if (!card) {
    return (
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <PageHead title={t('seo.kanban.title')} description={t('seo.kanban.description')} />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">{t('kanban.cardNotFound')}</Typography>
        </Box>
      </Box>
    );
  }

  const sortedComments = [...card.comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <>
      <PageHead
        title={`${card.title} \u00b7 ${t('seo.kanban.title')}`}
        description={t('seo.kanban.description')}
      />
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <PageHeader
          title={card.title}
          backTo={`/tools/kanban/${roomId}`}
          backAriaLabel={t('kanban.aria.back')}
          variant="h6"
        />

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', p: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {sortedComments.length === 0 ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {t('kanban.noComments')}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
              {sortedComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  participants={room.participants}
                  ownParticipantId={ownParticipantId}
                  isEditing={editingCommentId === comment.id}
                  editContent={editContent}
                  onEditContentChange={setEditContent}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={handleSaveEdit}
                  onDelete={handleDelete}
                />
              ))}
            </Box>
          )}

          <CommentForm value={newComment} onChange={setNewComment} onAdd={handleAdd} />
        </Box>
      </Box>
    </>
  );
}
