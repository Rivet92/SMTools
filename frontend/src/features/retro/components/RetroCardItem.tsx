import { memo } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  IconThumbUp,
  IconTrash,
  IconGripVertical,
  IconPlus,
  IconMinus,
  IconArrowUpRight,
} from '@tabler/icons-react';
import type { RetroCard, RetroParticipant } from '../../../types/models/retro';
import { RetroPhase } from '../../../types/models/retro';

export const RetroCardItem = memo(function RetroCardItem({
  card,
  participants,
  phase,
  ownParticipantId,
  isAdmin,
  onDeleteCard,
  onAddVotePoint,
  onRemoveVotePoint,
  onRemoveFromGroup,
  dropId,
  draggable,
  collapsed = false,
  canAddVote,
}: {
  card: RetroCard;
  participants: RetroParticipant[];
  phase: RetroPhase;
  ownParticipantId: string;
  isAdmin: boolean;
  onDeleteCard: (cardId: string) => void;
  onAddVotePoint?: (cardId: string) => void;
  onRemoveVotePoint?: (cardId: string) => void;
  onRemoveFromGroup?: (cardId: string) => void;
  dropId?: string;
  draggable?: boolean;
  collapsed?: boolean;
  canAddVote?: boolean;
}) {
  const { t } = useTranslation();
  const author = participants.find((p) => p.id === card.authorParticipantId);
  const isAuthor = card.authorParticipantId === ownParticipantId;
  const showVoteControls =
    phase === RetroPhase.Voting && onAddVotePoint !== undefined && onRemoveVotePoint !== undefined;
  const showVoteTotal = phase === RetroPhase.Actions;
  const showDelete = phase === RetroPhase.Gathering && isAuthor;
  const showRemoveFromGroup = phase === RetroPhase.Grouping && isAdmin && card.groupId !== null;

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: dropId ?? card.id,
    disabled: !draggable,
    data: { type: 'card', cardId: card.id, groupId: card.groupId },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dropId ?? card.id,
    disabled: !dropId || !draggable,
    data: { type: 'card', cardId: card.id },
  });

  const transformStyle = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined;

  return (
    <Box
      ref={(node: HTMLElement | null) => {
        setDropRef(node);
        setDragRef(node);
      }}
      style={{ transform: transformStyle }}
      sx={{
        p: 1,
        bgcolor: isOver ? 'action.selected' : 'background.paper',
        borderRadius: 1,
        border: 1,
        borderColor: isOver ? 'primary.main' : 'divider',
        opacity: isDragging ? 0.5 : 1,
        cursor: draggable ? 'grab' : 'default',
        '&:active': draggable ? { cursor: 'grabbing' } : undefined,
        transition: 'background-color 150ms, border-color 150ms',
      }}
      {...(draggable ? { ...attributes, ...listeners } : {})}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        {draggable && (
          <Box sx={{ color: 'text.disabled', mt: 0.25, flexShrink: 0 }}>
            <IconGripVertical size={14} />
          </Box>
        )}
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', flex: 1 }}>
          {card.content}
        </Typography>
      </Box>

      {(!collapsed || showRemoveFromGroup) && (
        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.75 }}
        >
          <Typography variant="caption" color="text.secondary">
            {author?.displayName ?? t('retro.unassigned')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {showVoteTotal && (
              <Tooltip title={t('retro.vote')}>
                <Chip
                  icon={<IconThumbUp size={14} />}
                  label={card.voteCount}
                  size="small"
                  color="default"
                  sx={{ cursor: 'default' }}
                />
              </Tooltip>
            )}
            {showVoteControls && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <IconButton
                  size="small"
                  onClick={() => onRemoveVotePoint?.(card.id)}
                  disabled={card.ownVotePoints <= 0}
                  aria-label={t('retro.aria.removeVote')}
                >
                  <IconMinus size={14} />
                </IconButton>
                <Typography
                  variant="body2"
                  sx={{ minWidth: 28, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}
                  title={t('retro.ownVotes', { own: card.ownVotePoints, total: card.voteCount })}
                >
                  {card.ownVotePoints}/{card.voteCount}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => onAddVotePoint?.(card.id)}
                  disabled={!canAddVote}
                  aria-label={t('retro.aria.addVote')}
                >
                  <IconPlus size={14} />
                </IconButton>
              </Box>
            )}
            {showRemoveFromGroup && (
              <Tooltip title={t('retro.removeFromGroup')}>
                <IconButton
                  size="small"
                  onClick={() => onRemoveFromGroup?.(card.id)}
                  aria-label={t('retro.aria.removeFromGroup')}
                >
                  <IconArrowUpRight size={14} />
                </IconButton>
              </Tooltip>
            )}
            {showDelete && (
              <IconButton
                size="small"
                color="error"
                onClick={() => onDeleteCard(card.id)}
                aria-label={t('retro.aria.deleteCard')}
              >
                <IconTrash size={14} />
              </IconButton>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
});
