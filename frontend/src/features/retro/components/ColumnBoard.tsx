import { useCallback } from 'react';
import { Box, Typography, Paper, Stack, IconButton, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { IconPlus } from '@tabler/icons-react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  rectIntersection,
  type DragEndEvent,
} from '@dnd-kit/core';
import type {
  RetroColumn,
  RetroCard,
  RetroCardGroup,
  RetroParticipant,
} from '../../../types/models/retro';
import { RetroPhase, getRetroColumnNameKey } from '../../../types/models/retro';
import { RetroColumnIcon } from '../lib/retroColumnIcons';
import {
  cardDropId,
  groupDropId,
  ungroupedDropId,
  parseDragId,
  handleCardDrop,
} from '../lib/retroDnd';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { GroupCard } from './GroupCard';
import { RetroCardItem } from './RetroCardItem';

export function ColumnBoard({
  templateKey,
  column,
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
  column: RetroColumn;
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
  const { t } = useTranslation();
  const showAdd = phase === RetroPhase.Gathering;
  const allowGrouping = phase === RetroPhase.Grouping && isAdmin;

  const groupedCards =
    phase === RetroPhase.Gathering ? [] : cards.filter((c) => c.groupId !== null);
  const ungroupedCards =
    phase === RetroPhase.Gathering ? cards : cards.filter((c) => c.groupId === null);
  const columnGroups =
    phase === RetroPhase.Gathering
      ? []
      : groups.filter((g) => groupedCards.some((c) => c.groupId === g.id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ungroupedZoneId = ungroupedDropId(column.id);
  const { setNodeRef: setUngroupedRef, isOver: isOverUngrouped } = useDroppable({
    id: ungroupedZoneId,
    disabled: !allowGrouping,
    data: { type: 'ungrouped', columnId: column.id },
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeParsed = parseDragId(String(active.id));
      const overParsed = parseDragId(String(over.id));
      if (!activeParsed || activeParsed.type !== 'card' || !overParsed) return;

      const draggedCardId = activeParsed.entityId;
      const draggedCard = cards.find((c) => c.id === draggedCardId);

      if (overParsed.type === 'group') {
        if (draggedCard?.groupId === overParsed.entityId) {
          onMoveCardToGroup(draggedCardId, undefined);
        } else {
          onMoveCardToGroup(draggedCardId, overParsed.entityId);
        }
      } else if (overParsed.type === 'ungrouped') {
        onMoveCardToGroup(draggedCardId, undefined);
      } else {
        handleCardDrop(
          draggedCardId,
          overParsed.entityId,
          cards,
          onMoveCardToGroup,
          onCreateGroupFromCards,
        );
      }
    },
    [cards, onMoveCardToGroup, onCreateGroupFromCards],
  );

  const boardContent = (
    <Stack spacing={0.5} sx={{ height: '100%' }}>
      {columnGroups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          cards={cards.filter((c) => c.groupId === group.id)}
          participants={participants}
          phase={phase}
          ownParticipantId={ownParticipantId}
          isAdmin={isAdmin}
          onDeleteCard={onDeleteCard}
          onAddVotePoint={onAddVotePoint}
          onRemoveVotePoint={onRemoveVotePoint}
          onMoveCardToGroup={onMoveCardToGroup}
          dropId={groupDropId(group.id)}
          draggable={allowGrouping}
          canAddVote={canAddVote}
        />
      ))}

      <Box
        ref={setUngroupedRef}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          flex: 1,
          minHeight: 40,
          p: 0.5,
          borderRadius: 1,
          border: 1,
          borderStyle: 'dashed',
          borderColor: isOverUngrouped ? 'primary.main' : 'transparent',
          bgcolor: isOverUngrouped ? 'action.selected' : 'transparent',
          transition: 'background-color 150ms, border-color 150ms',
        }}
      >
        {ungroupedCards.map((card) => (
          <RetroCardItem
            key={card.id}
            card={card}
            participants={participants}
            phase={phase}
            ownParticipantId={ownParticipantId}
            isAdmin={isAdmin}
            onDeleteCard={onDeleteCard}
            onAddVotePoint={onAddVotePoint}
            onRemoveVotePoint={onRemoveVotePoint}
            dropId={cardDropId(card.id)}
            draggable={allowGrouping}
            canAddVote={canAddVote}
          />
        ))}

        {ungroupedCards.length === 0 && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {phase === RetroPhase.Gathering ? t('retro.gatheringHint') :
               phase === RetroPhase.Voting ? t('retro.votingHint') :
               phase === RetroPhase.Grouping ? t('retro.groupingHint') :
               t('retro.noCards')}
            </Typography>
          </Box>
        )}
      </Box>
    </Stack>
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box
        sx={{
          p: 1,
          borderBottom: 3,
          borderColor: column.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RetroColumnIcon name={column.icon} size={18} />
          <Typography variant="subtitle2" fontWeight={600}>
            {t(getRetroColumnNameKey(templateKey, column.key))}
          </Typography>
        </Box>
        {showAdd && (
          <Tooltip title={t('retro.addCard')}>
            <IconButton
              size="small"
              onClick={() => onAddCard(column.id)}
              aria-label={t('retro.aria.addCard')}
            >
              <IconPlus size={18} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 0.5 }}>
        {allowGrouping ? (
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragEnd={handleDragEnd}
          >
            {boardContent}
          </DndContext>
        ) : (
          boardContent
        )}
      </Box>
    </Paper>
  );
}
