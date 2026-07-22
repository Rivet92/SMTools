import { memo, useState } from 'react';
import {
  Box,
  Card as MuiCard,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Tooltip,
} from '@mui/material';
import { IconMessageCircle, IconUser, IconUserOff } from '@tabler/icons-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import type { Card, Participant } from '../store/kanbanStore';

export const KanbanCardItem = memo(function KanbanCardItem({
  card,
  participants,
  canEdit,
  onEdit,
  onAssign,
  isPending,
}: {
  card: Card;
  participants: Participant[];
  canEdit: boolean;
  onEdit: (card: Card) => void;
  onAssign: (cardId: string, assignedParticipantId: string | null) => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : isPending ? 0.6 : 1,
    cursor: 'grab',
    touchAction: 'none',
  };

  const assignee = card.assignedParticipantId
    ? (participants.find((p) => p.id === card.assignedParticipantId) ?? null)
    : null;

  return (
    <MuiCard
      variant="outlined"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{ mb: 1 }}
    >
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{
            wordBreak: 'break-word',
            ...(canEdit
              ? {
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }
              : {}),
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (canEdit) onEdit(card);
          }}
        >
          {card.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
          <IconButton
            size="small"
            aria-label={t('kanban.aria.assignParticipant')}
            aria-haspopup="menu"
            aria-controls={anchorEl !== null ? `assignee-menu-${card.id}` : undefined}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setAnchorEl(e.currentTarget as HTMLElement);
            }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              borderRadius: 1,
              px: 0.5,
              py: 0.25,
              '&:hover': {
                bgcolor: 'action.hover',
                boxShadow: 1,
              },
            }}
          >
            {assignee ? <IconUser size={14} /> : <IconUserOff size={14} />}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.25 }}>
              {assignee ? assignee.displayName : t('kanban.unassigned')}
            </Typography>
          </IconButton>

          {card.initialEstimation != null && card.remaining != null && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.25 }}>
              {Math.round(
                ((card.initialEstimation - card.remaining) / card.initialEstimation) * 100,
              )}
              %
            </Typography>
          )}

          <Box sx={{ ml: 'auto' }}>
            <Tooltip title={t('kanban.comments')}>
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.25,
                  cursor: 'pointer',
                  px: 0.5,
                  py: 0.25,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  navigate(`/tools/kanban/${roomId}/${card.id}/comments`);
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {card.comments.length}
                </Typography>
                <IconMessageCircle size={14} />
              </Box>
            </Tooltip>
          </Box>
        </Box>

        <Menu
          id={`assignee-menu-${card.id}`}
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          onClick={() => setAnchorEl(null)}
        >
          {card.assignedParticipantId && (
            <MenuItem onClick={() => onAssign(card.id, null)}>
              <IconUserOff size={16} style={{ marginRight: 8 }} />
              {t('kanban.unassigned')}
            </MenuItem>
          )}
          {participants
            .filter((p) => p.isConnected)
            .map((p) => (
              <MenuItem
                key={p.id}
                selected={p.id === card.assignedParticipantId}
                onClick={() => onAssign(card.id, p.id)}
              >
                <IconUser size={16} style={{ marginRight: 8 }} />
                {p.displayName}
              </MenuItem>
            ))}
        </Menu>
      </CardContent>
    </MuiCard>
  );
});
