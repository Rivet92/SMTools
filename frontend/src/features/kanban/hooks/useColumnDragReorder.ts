import { useCallback, useState } from 'react';
import type { Column } from '../store/kanbanStore';

export function useColumnDragReorder(
  columns: Column[],
  handleReorderColumns: (ids: string[]) => Promise<void>,
) {
  const [orderedColumns, setOrderedColumns] = useState<Column[] | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const displayColumns = orderedColumns ?? columns;

  const handleDragStart = useCallback((columnId: string) => {
    setDraggedId(columnId);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, overId: string) => {
      e.preventDefault();
      if (!draggedId || draggedId === overId) return;

      setOrderedColumns((current) => {
        const list = current ?? columns;
        const fromIndex = list.findIndex((c) => c.id === draggedId);
        const toIndex = list.findIndex((c) => c.id === overId);
        if (fromIndex === -1 || toIndex === -1) return list;

        const next = [...list];
        const [moved] = next.splice(fromIndex, 1);
        if (!moved) return list;
        next.splice(toIndex, 0, moved);
        return next;
      });
    },
    [draggedId, columns],
  );

  const handleDragEnd = useCallback(async () => {
    setDraggedId(null);
    const list = orderedColumns ?? columns;
    const ids = list.map((c) => c.id);
    setOrderedColumns(null);
    await handleReorderColumns(ids);
  }, [columns, handleReorderColumns, orderedColumns]);

  return {
    displayColumns,
    draggedId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
