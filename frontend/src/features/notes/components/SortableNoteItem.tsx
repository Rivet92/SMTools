import { Box, ListItemButton, ListItemText } from '@mui/material';
import { IconGripVertical } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Note } from '../../../types/models/notes';

export interface SortableNoteItemProps {
  note: Note;
  isSelected: boolean;
  onClick: () => void;
}

export function SortableNoteItem({ note, isSelected, onClick }: SortableNoteItemProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ListItemButton
      ref={setNodeRef}
      style={style}
      selected={isSelected}
      onClick={onClick}
      sx={{ borderRadius: 1, mb: 0.25, mx: 0.5, gap: 0.5 }}
    >
      <Box
        component="span"
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'grab',
          color: 'text.disabled',
          '&:active': { cursor: 'grabbing' },
        }}
        {...attributes}
        {...listeners}
      >
        <IconGripVertical size={14} />
      </Box>
      <ListItemText
        primary={note.title || t('notes.untitled')}
        primaryTypographyProps={{
          noWrap: true,
          fontWeight: isSelected ? 600 : 400,
          fontSize: '0.875rem',
          color: note.title ? 'text.primary' : 'text.disabled',
        }}
      />
    </ListItemButton>
  );
}
