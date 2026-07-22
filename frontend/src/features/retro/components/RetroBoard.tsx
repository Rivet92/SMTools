import { memo } from 'react';
import { Box } from '@mui/material';
import type {
  RetroColumn,
  RetroCard,
  RetroCardGroup,
  RetroParticipant,
} from '../../../types/models/retro';
import { RetroPhase } from '../../../types/models/retro';
import { ColumnBoard } from './ColumnBoard';

export const RetroBoard = memo(function RetroBoard({
  templateKey,
  columns,
  cards,
  groups,
  participants,
  phase,
  ownParticipantId,
  isAdmin,
  onAddCard,
  onDeleteCard,
  onAddVotePoint,
  onRemoveVotePoint,
  onMoveCardToGroup,
  onCreateGroupFromCards,
  canAddVote,
}: {
  templateKey: string;
  columns: RetroColumn[];
  cards: RetroCard[];
  groups: RetroCardGroup[];
  participants: RetroParticipant[];
  phase: RetroPhase;
  ownParticipantId: string;
  isAdmin: boolean;
  onAddCard: (columnId: string) => void;
  onDeleteCard: (cardId: string) => void;
  onAddVotePoint: (cardId: string) => void;
  onRemoveVotePoint: (cardId: string) => void;
  onMoveCardToGroup: (cardId: string, groupId?: string) => void;
  onCreateGroupFromCards: (firstCardId: string, secondCardId: string, title: string) => void;
  canAddVote: boolean;
}) {
  const visibleCards =
    phase === RetroPhase.Gathering
      ? cards.filter((c) => c.authorParticipantId === ownParticipantId)
      : cards;

  return (
    <Box sx={{ flex: 1, overflow: 'hidden', p: 1 }}>
      <Box sx={{ display: 'flex', gap: 0.5, height: '100%' }}>
        {columns.map((column) => (
          <ColumnBoard
            key={column.id}
            templateKey={templateKey}
            column={column}
            cards={visibleCards.filter((c) => c.columnId === column.id)}
            groups={groups}
            participants={participants}
            phase={phase}
            ownParticipantId={ownParticipantId}
            isAdmin={isAdmin}
            onAddCard={onAddCard}
            onDeleteCard={onDeleteCard}
            onAddVotePoint={onAddVotePoint}
            onRemoveVotePoint={onRemoveVotePoint}
            onMoveCardToGroup={onMoveCardToGroup}
            onCreateGroupFromCards={onCreateGroupFromCards}
            canAddVote={canAddVote}
          />
        ))}
      </Box>
    </Box>
  );
});
