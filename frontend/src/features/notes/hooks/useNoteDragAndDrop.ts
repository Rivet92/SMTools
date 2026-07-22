import { useCallback, useMemo } from 'react';
import {
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  MeasuringStrategy,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Note } from '../../../types/models/notes';
import type { NoteReorderItem } from '../../../api/notes';

export interface UseNoteDragAndDropOptions {
  activeNotes: Note[];
  archivedNotes: Note[];
  onReorder: (updates: NoteReorderItem[]) => void;
}

export interface UseNoteDragAndDropResult {
  sensors: ReturnType<typeof useSensors>;
  collisionDetection: typeof closestCenter;
  measuring: { droppable: { strategy: MeasuringStrategy.Always } };
  activeIds: string[];
  archivedIds: string[];
  handleDragEnd: (event: DragEndEvent) => void;
}

export function useNoteDragAndDrop({
  activeNotes,
  archivedNotes,
  onReorder,
}: UseNoteDragAndDropOptions): UseNoteDragAndDropResult {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeIds = useMemo(() => activeNotes.map((note) => note.id), [activeNotes]);
  const archivedIds = useMemo(() => archivedNotes.map((note) => note.id), [archivedNotes]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      const isOverDroppable = overId === 'active-drop-zone' || overId === 'archived-drop-zone';
      const isActiveInActive = activeIds.includes(activeId);
      const isOverInActive = isOverDroppable
        ? overId === 'active-drop-zone'
        : activeIds.includes(overId);

      const sameSection = !isOverDroppable && isActiveInActive === isOverInActive;

      let newActiveIds: string[];
      let newArchivedIds: string[];

      if (sameSection) {
        const ids = isActiveInActive ? activeIds : archivedIds;
        const oldIdx = ids.indexOf(activeId);
        const newIdx = ids.indexOf(overId);
        const reordered = arrayMove(ids, oldIdx, newIdx);
        if (isActiveInActive) {
          newActiveIds = reordered;
          newArchivedIds = archivedIds;
        } else {
          newActiveIds = activeIds;
          newArchivedIds = reordered;
        }
      } else {
        const sourceIds = (isActiveInActive ? activeIds : archivedIds).filter(
          (id) => id !== activeId,
        );
        const targetIds = [...(isActiveInActive ? archivedIds : activeIds)];
        if (!isOverDroppable) {
          const insertAt = targetIds.indexOf(overId);
          targetIds.splice(insertAt >= 0 ? insertAt : targetIds.length, 0, activeId);
        } else {
          targetIds.push(activeId);
        }

        if (isActiveInActive) {
          newActiveIds = sourceIds;
          newArchivedIds = targetIds;
        } else {
          newActiveIds = targetIds;
          newArchivedIds = sourceIds;
        }
      }

      const updates: NoteReorderItem[] = [];
      newActiveIds.forEach((id, idx) => {
        updates.push({ noteId: id, position: idx, isArchived: false });
      });
      newArchivedIds.forEach((id, idx) => {
        updates.push({ noteId: id, position: idx, isArchived: true });
      });

      onReorder(updates);
    },
    [activeIds, archivedIds, onReorder],
  );

  return {
    sensors,
    collisionDetection: closestCenter,
    measuring: { droppable: { strategy: MeasuringStrategy.Always } },
    activeIds,
    archivedIds,
    handleDragEnd,
  };
}
