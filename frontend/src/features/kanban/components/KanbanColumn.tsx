import { memo } from 'react';
import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { IconInfoCircle, IconPlus } from '@tabler/icons-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import { MarkdownPreview } from '../../../components/markdown';
import type { Card, Column, Participant } from '../store/kanbanStore';
import { KanbanCardItem } from './KanbanCardItem';

export const KanbanColumn = memo(function KanbanColumn({
  column,
  cards,
  participants,
  ownParticipantId,
  canManage,
  onAddCard,
  onEditCard,
  onAssignCard,
  pendingCardId,
}: {
  column: Column;
  cards: Card[];
  participants: Participant[];
  ownParticipantId: string;
  canManage: boolean;
  onAddCard: (columnId: string) => void;
  onEditCard: (card: Card) => void;
  onAssignCard: (cardId: string, assignedParticipantId: string | null) => void;
  pendingCardId: string | null;
}) {
  const { t } = useTranslation();
  const { setNodeRef: setDroppableRef } = useDroppable({ id: column.id });

  return (
    <Paper
      variant="outlined"
      sx={{
        minWidth: 280,
        maxWidth: 320,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
          {column.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {column.description && (
            <Tooltip
              title={
                <Box sx={{ '& > *:first-child': { mt: 0 } }}>
                  <MarkdownPreview content={column.description} />
                </Box>
              }
              arrow
              slotProps={{
                tooltip: { sx: { maxWidth: 320, maxHeight: 300, overflow: 'auto', p: 1.5 } },
              }}
            >
              <Box
                component="span"
                sx={{ display: 'flex', alignItems: 'center', mr: 0.5, color: 'text.secondary' }}
                aria-label={t('kanban.aria.columnInfo')}
              >
                <IconInfoCircle size={16} />
              </Box>
            </Tooltip>
          )}
          <Tooltip title={t('kanban.addCard')}>
            <IconButton
              size="small"
              onClick={() => onAddCard(column.id)}
              aria-label={t('kanban.aria.addCard')}
            >
              <IconPlus size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box ref={setDroppableRef} sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        <SortableContext
          id={column.id}
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <KanbanCardItem
              key={card.id}
              card={card}
              participants={participants}
              canEdit={canManage || card.authorParticipantId === ownParticipantId}
              onEdit={onEditCard}
              onAssign={onAssignCard}
              isPending={pendingCardId === card.id}
            />
          ))}
          {cards.length === 0 && (
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80 }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {t('kanban.noCards')}
              </Typography>
            </Box>
          )}
        </SortableContext>
      </Box>
    </Paper>
  );
});
