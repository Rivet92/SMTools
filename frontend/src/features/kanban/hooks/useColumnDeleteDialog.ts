import { useCallback, useMemo, useState } from 'react';
import type { Column } from '../store/kanbanStore';

export function useColumnDeleteDialog(
  columns: Column[],
  cardsByColumn: Map<string, import('../store/kanbanStore').Card[]>,
  handleDeleteColumn: (columnId: string, targetColumnId?: string) => Promise<void>,
) {
  const [deleteCandidate, setDeleteCandidate] = useState<Column | null>(null);
  const [targetColumnId, setTargetColumnId] = useState<string>('');

  const handleRequestDelete = useCallback((column: Column) => {
    setDeleteCandidate(column);
    setTargetColumnId('');
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteCandidate) return;
    const target = targetColumnId || undefined;
    await handleDeleteColumn(deleteCandidate.id, target);
    setDeleteCandidate(null);
    setTargetColumnId('');
  }, [deleteCandidate, handleDeleteColumn, targetColumnId]);

  const handleCancelDelete = useCallback(() => {
    setDeleteCandidate(null);
    setTargetColumnId('');
  }, []);

  const candidateCardCount = useMemo(() => {
    if (!deleteCandidate) return 0;
    return cardsByColumn.get(deleteCandidate.id)?.length ?? 0;
  }, [cardsByColumn, deleteCandidate]);

  const otherColumns = useMemo(
    () => columns.filter((c) => c.id !== deleteCandidate?.id),
    [columns, deleteCandidate],
  );

  return {
    deleteCandidate,
    targetColumnId,
    setTargetColumnId,
    handleRequestDelete,
    handleConfirmDelete,
    handleCancelDelete,
    candidateCardCount,
    otherColumns,
  };
}
