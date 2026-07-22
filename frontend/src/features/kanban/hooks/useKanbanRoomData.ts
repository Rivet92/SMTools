import { useMemo } from 'react';
import { useKanbanStore } from '../store/kanbanStore';
import type { Card } from '../store/kanbanStore';
import { selectIsOwner, selectIsAdmin } from '../../../stores/roomSelectors';

export function useKanbanRoomData() {
  const room = useKanbanStore((s) => s.room);
  const connectionState = useKanbanStore((s) => s.connectionState);
  const storeError = useKanbanStore((s) => s.error);
  const setError = useKanbanStore((s) => s.setError);
  const isOwner = useKanbanStore((s) => selectIsOwner(s.room));
  const isAdmin = useKanbanStore((s) => selectIsAdmin(s.room));
  const hasPassword = room?.hasPassword ?? false;

  const columns = useMemo(() => {
    if (!room) return [];
    return [...room.columns].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [room]);

  const cardsByColumn = useMemo(() => {
    if (!room) return new Map<string, Card[]>();
    const map = new Map<string, Card[]>();
    for (const column of room.columns) {
      const columnCards = room.cards
        .filter((c) => c.columnId === column.id)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      map.set(column.id, columnCards);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.cards, room?.columns]);

  return {
    room,
    connectionState,
    storeError,
    setError,
    isOwner,
    isAdmin,
    columns,
    cardsByColumn,
    hasPassword,
  };
}
