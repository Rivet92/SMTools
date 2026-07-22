import { useState } from 'react';
import { Box, Collapse, List, Typography } from '@mui/material';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  useSensors,
  type DragEndEvent,
  MeasuringStrategy,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { EmptyDroppable } from './EmptyDroppable';
import { SortableNoteItem } from './SortableNoteItem';
import type { Note } from '../../../types/models/notes';

export interface NotesSidebarProps {
  activeNotes: Note[];
  archivedNotes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (note: Note) => void;
  sensors: ReturnType<typeof useSensors>;
  collisionDetection: typeof closestCenter;
  measuring: { droppable: { strategy: MeasuringStrategy.Always } };
  activeIds: string[];
  archivedIds: string[];
  handleDragEnd: (event: DragEndEvent) => void;
}

export function NotesSidebar({
  activeNotes,
  archivedNotes,
  selectedNoteId,
  onSelectNote,
  sensors,
  collisionDetection,
  measuring,
  activeIds,
  archivedIds,
  handleDragEnd,
}: NotesSidebarProps) {
  const { t } = useTranslation();
  const [activeCollapsed, setActiveCollapsed] = useState(false);
  const [archivedCollapsed, setArchivedCollapsed] = useState(false);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragEnd={handleDragEnd}
      measuring={measuring}
    >
      <Box
        sx={{
          width: 260,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          borderRight: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          onClick={() => setActiveCollapsed((prev) => !prev)}
          sx={{
            pt: 1.5,
            pb: 0.5,
            px: 1.5,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': { opacity: 0.7 },
          }}
        >
          <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: 0.5, flex: 1 }}>
            {t('notes.active')}
          </Typography>
          {activeCollapsed ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
        </Box>
        <Collapse in={!activeCollapsed}>
          <List dense disablePadding>
            <SortableContext items={activeIds} strategy={verticalListSortingStrategy}>
              {activeNotes.map((note) => (
                <SortableNoteItem
                  key={note.id}
                  note={note}
                  isSelected={note.id === selectedNoteId}
                  onClick={() => onSelectNote(note)}
                />
              ))}
            </SortableContext>
            {activeNotes.length === 0 && <EmptyDroppable id="active-drop-zone" />}
          </List>
        </Collapse>

        <Box
          onClick={() => setArchivedCollapsed((prev) => !prev)}
          sx={{
            pt: 1.5,
            pb: 0.5,
            px: 1.5,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': { opacity: 0.7 },
          }}
        >
          <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: 0.5, flex: 1 }}>
            {t('notes.archived')}
          </Typography>
          {archivedCollapsed ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
        </Box>
        <Collapse in={!archivedCollapsed}>
          <List dense disablePadding>
            <SortableContext items={archivedIds} strategy={verticalListSortingStrategy}>
              {archivedNotes.map((note) => (
                <SortableNoteItem
                  key={note.id}
                  note={note}
                  isSelected={note.id === selectedNoteId}
                  onClick={() => onSelectNote(note)}
                />
              ))}
            </SortableContext>
            {archivedNotes.length === 0 && <EmptyDroppable id="archived-drop-zone" />}
          </List>
        </Collapse>
      </Box>
    </DndContext>
  );
}
