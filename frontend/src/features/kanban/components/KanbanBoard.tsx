import { useCallback, useState } from 'react';
import { Box, Card as MuiCard, CardContent, Typography } from '@mui/material';
import { IconUser, IconUserOff } from '@tabler/icons-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import type { Card, Column, Participant } from '../store/kanbanStore';
import { KanbanColumn } from './KanbanColumn';

export function KanbanBoard({
  columns,
  cardsByColumn,
  participants,
  ownParticipantId,
  canManage,
  onAddCard,
  onEditCard,
  onMoveCard,
  onAssignCard,
  pendingCardId,
}: {
  columns: Column[];
  cardsByColumn: Map<string, Card[]>;
  participants: Participant[];
  ownParticipantId: string;
  canManage: boolean;
  onAddCard: (columnId: string) => void;
  onEditCard: (card: Card) => void;
  onMoveCard: (cardId: string, columnId: string, displayOrder: number) => void;
  onAssignCard: (cardId: string, assignedParticipantId: string | null) => void;
  pendingCardId: string | null;
}) {
  const { t } = useTranslation();
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findCard = useCallback(
    (cardId: string): Card | null => {
      for (const cards of cardsByColumn.values()) {
        const found = cards.find((c) => c.id === cardId);
        if (found) return found;
      }
      return null;
    },
    [cardsByColumn],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const card = findCard(event.active.id as string);
      if (card) setActiveCard(card);
    },
    [findCard],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCard(null);
      const { active, over } = event;
      if (!over || !active) return;

      const activeId = active.id as string;
      const overId = over.id as string;
      const columnIds = new Set(columns.map((c) => c.id));

      const activeSortable = active.data.current?.sortable as { containerId: string } | undefined;
      const overSortable = over.data.current?.sortable as { containerId: string } | undefined;

      const activeContainerId = activeSortable?.containerId;
      // over can be a sortable item (has containerId) or the column container itself
      const overContainerId =
        overSortable?.containerId ?? (columnIds.has(overId) ? overId : undefined);

      if (!activeContainerId || !overContainerId) return;

      if (activeContainerId === overContainerId) {
        const cards = cardsByColumn.get(activeContainerId) ?? [];
        const activeIndex = cards.findIndex((c) => c.id === activeId);
        const overIndex = cards.findIndex((c) => c.id === overId);
        if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return;
        onMoveCard(activeId, activeContainerId, overIndex + 1);
      } else {
        const targetCards = cardsByColumn.get(overContainerId) ?? [];
        const overIndex = targetCards.findIndex((c) => c.id === overId);
        const targetOrder = overIndex !== -1 ? overIndex + 1 : targetCards.length + 1;
        onMoveCard(activeId, overContainerId, targetOrder);
      }
    },
    [cardsByColumn, onMoveCard, columns],
  );

  return (
    <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch', height: '100%' }}>
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              cards={cardsByColumn.get(column.id) ?? []}
              participants={participants}
              ownParticipantId={ownParticipantId}
              canManage={canManage}
              onAddCard={onAddCard}
              onEditCard={onEditCard}
              onAssignCard={onAssignCard}
              pendingCardId={pendingCardId}
            />
          ))}
        </Box>
        <DragOverlay>
          {activeCard ? (
            <Box sx={{ opacity: 0.9, width: 280 }}>
              <MuiCard variant="outlined">
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                    {activeCard.title}
                  </Typography>
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, minHeight: 20 }}
                  >
                    {activeCard.assignedParticipantId ? (
                      <IconUser size={14} />
                    ) : (
                      <IconUserOff size={14} />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {activeCard.assignedParticipantId
                        ? (participants.find((p) => p.id === activeCard.assignedParticipantId)
                            ?.displayName ?? '')
                        : t('kanban.unassigned')}
                    </Typography>
                  </Box>
                </CardContent>
              </MuiCard>
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Box>
  );
}
