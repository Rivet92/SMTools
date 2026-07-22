import { useState, useCallback } from 'react';
import { Box, Stack, IconButton, Collapse } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useDroppable } from '@dnd-kit/core';
import type { RetroCard, RetroCardGroup, RetroParticipant } from '../../../types/models/retro';
import { RetroPhase } from '../../../types/models/retro';
import { RetroCardItem } from './RetroCardItem';
import { cardDropId } from '../lib/retroDnd';

export function GroupCard({
  group,
  cards,
  participants,
  phase,
  ownParticipantId,
  isAdmin,
  onDeleteCard,
  onAddVotePoint,
  onRemoveVotePoint,
  onMoveCardToGroup,
  dropId,
  draggable,
  canAddVote,
}: {
  group: RetroCardGroup;
  cards: RetroCard[];
  participants: RetroParticipant[];
  phase: RetroPhase;
  ownParticipantId: string;
  isAdmin: boolean;
  onDeleteCard: (cardId: string) => void;
  onAddVotePoint: (cardId: string) => void;
  onRemoveVotePoint: (cardId: string) => void;
  onMoveCardToGroup: (cardId: string, groupId?: string) => void;
  dropId?: string;
  draggable?: boolean;
  canAddVote: boolean;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const firstCard = cards[0];

  const handleRemoveFromGroup = useCallback(
    (cardId: string) => {
      onMoveCardToGroup(cardId, undefined);
    },
    [onMoveCardToGroup],
  );
  const remainingCards = cards.slice(1);
  const cardCount = cards.length;
  const firstCollapsed = phase === RetroPhase.Grouping && !expanded;

  const { setNodeRef, isOver } = useDroppable({
    id: dropId ?? group.id,
    disabled: !dropId || !draggable,
    data: { type: 'group', groupId: group.id },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: 'relative',
        p: '2px',
        pt: '22px',
        bgcolor: isOver ? 'action.selected' : 'action.hover',
        borderRadius: 1,
        border: 1,
        borderColor: isOver ? 'primary.main' : 'divider',
        transition: 'background-color 150ms, border-color 150ms',
      }}
    >
      <IconButton
        size="small"
        onClick={() => setExpanded((prev) => !prev)}
        aria-label={expanded ? t('retro.aria.collapseGroup') : t('retro.aria.expandGroup')}
        sx={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          p: 0.25,
          zIndex: 1,
          bgcolor: 'background.paper',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
      </IconButton>

      {cardCount > 1 && (
        <Box
          sx={{
            position: 'absolute',
            top: '2px',
            left: '2px',
            zIndex: 1,
            minWidth: 18,
            height: 18,
            px: 0.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.paper',
            borderRadius: 1,
            fontSize: '0.75rem',
            lineHeight: 1,
            color: 'text.secondary',
          }}
          title={t('retro.groupCardCount', { count: cardCount })}
        >
          {cardCount}
        </Box>
      )}

      <Stack spacing={0.5}>
        {firstCard && (
          <RetroCardItem
            key={firstCard.id}
            card={firstCard}
            participants={participants}
            phase={phase}
            ownParticipantId={ownParticipantId}
            isAdmin={isAdmin}
            onDeleteCard={onDeleteCard}
            onAddVotePoint={onAddVotePoint}
            onRemoveVotePoint={onRemoveVotePoint}
            dropId={cardDropId(firstCard.id)}
            draggable={draggable}
            collapsed={firstCollapsed}
            onRemoveFromGroup={handleRemoveFromGroup}
            canAddVote={canAddVote}
          />
        )}

        <Collapse in={expanded}>
          <Stack spacing={0.5}>
            {remainingCards.map((card) => (
              <RetroCardItem
                key={card.id}
                card={card}
                participants={participants}
                phase={phase}
                ownParticipantId={ownParticipantId}
                isAdmin={isAdmin}
                onDeleteCard={onDeleteCard}
                dropId={cardDropId(card.id)}
                draggable={draggable}
                onRemoveFromGroup={handleRemoveFromGroup}
              />
            ))}
          </Stack>
        </Collapse>
      </Stack>
    </Box>
  );
}
