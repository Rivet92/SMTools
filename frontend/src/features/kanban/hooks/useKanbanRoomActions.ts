import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as hub from '../kanbanHub';
import { useKanbanStore } from '../store/kanbanStore';
import { makeRoomAction } from '../../../hooks/makeRoomAction';
import { useRoomAdminActions } from '../../../hooks/useRoomAdminActions';
import type { RoomState } from '../store/kanbanStore';

export function useKanbanRoomActions() {
  const { t } = useTranslation();
  const setRoom = useKanbanStore((s) => s.setRoom);

  const [actionError, setActionError] = useState<string | null>(null);
  const [snackbarError, setSnackbarError] = useState<string | null>(null);

  const [pendingColumnId, setPendingColumnId] = useState<string | null>(null);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);

  const handleAddColumn = useMemo(
    () =>
      makeRoomAction(
        (title: string, description?: string) =>
          hub.addColumn(title.trim(), description?.trim() || undefined),
        {
          t,
          errorKey: 'kanban.errors.addColumn',
          setRoom,
          setError: setActionError,
          rethrow: true,
        },
      ),
    [setRoom, t],
  );

  const handleUpdateColumn = useMemo(
    () =>
      makeRoomAction(
        (columnId: string, title: string, description?: string) => {
          const trimmed = title.trim();
          return hub.updateColumn(columnId, trimmed, description?.trim() || undefined);
        },
        {
          t,
          errorKey: 'kanban.errors.updateColumn',
          setRoom,
          setError: setSnackbarError,
          onStart: (columnId) => setPendingColumnId(columnId),
          onEnd: () => setPendingColumnId(null),
        },
      ),
    [setRoom, t],
  );

  const handleDeleteColumn = useMemo(
    () =>
      makeRoomAction(
        (columnId: string, targetColumnId?: string) => hub.deleteColumn(columnId, targetColumnId),
        {
          t,
          errorKey: 'kanban.errors.deleteColumn',
          setRoom,
          setError: setSnackbarError,
          onStart: (columnId) => setPendingColumnId(columnId),
          onEnd: () => setPendingColumnId(null),
        },
      ),
    [setRoom, t],
  );

  const handleReorderColumns = useMemo(
    () =>
      makeRoomAction((columnIds: string[]) => hub.reorderColumns(columnIds), {
        t,
        errorKey: 'kanban.errors.reorderColumns',
        setRoom,
        setError: setSnackbarError,
      }),
    [setRoom, t],
  );

  const handleAddCard = useMemo(
    () =>
      makeRoomAction(
        (
          columnId: string,
          title: string,
          description?: string,
          repoUrl?: string,
          repoBranch?: string,
          initialEstimation?: number,
          remaining?: number,
          dueAt?: string,
          assignedParticipantId?: string,
        ) => {
          const trimmed = title.trim();
          return hub.addCard(
            columnId,
            trimmed,
            description,
            repoUrl,
            repoBranch,
            initialEstimation,
            remaining,
            dueAt,
            assignedParticipantId,
          );
        },
        {
          t,
          errorKey: 'kanban.errors.addCard',
          setRoom,
          setError: setActionError,
          rethrow: true,
        },
      ),
    [setRoom, t],
  );

  const handleUpdateCard = useMemo(
    () =>
      makeRoomAction(
        (
          cardId: string,
          title: string,
          description?: string,
          repoUrl?: string,
          repoBranch?: string,
          initialEstimation?: number,
          remaining?: number,
          dueAt?: string,
          assignedParticipantId?: string,
        ) => {
          const trimmed = title.trim();
          return hub.updateCard(
            cardId,
            trimmed,
            description,
            repoUrl,
            repoBranch,
            initialEstimation,
            remaining,
            dueAt,
            assignedParticipantId,
          );
        },
        {
          t,
          errorKey: 'kanban.errors.updateCard',
          setRoom,
          setError: setSnackbarError,
          onStart: (cardId) => setPendingCardId(cardId),
          onEnd: () => setPendingCardId(null),
        },
      ),
    [setRoom, t],
  );

  const handleMoveCard = useMemo(
    () =>
      makeRoomAction(
        (cardId: string, columnId: string, displayOrder: number) =>
          hub.moveCard(cardId, columnId, displayOrder),
        {
          t,
          errorKey: 'kanban.errors.moveCard',
          setRoom,
          setError: setSnackbarError,
          onStart: (cardId) => setPendingCardId(cardId),
          onEnd: () => setPendingCardId(null),
        },
      ),
    [setRoom, t],
  );

  const handleAssignCard = useMemo(
    () =>
      makeRoomAction(
        (cardId: string, assignedParticipantId: string | null) =>
          hub.assignCard(cardId, assignedParticipantId),
        {
          t,
          errorKey: 'kanban.errors.assignCard',
          setRoom,
          setError: setSnackbarError,
          onStart: (cardId) => setPendingCardId(cardId),
          onEnd: () => setPendingCardId(null),
        },
      ),
    [setRoom, t],
  );

  const handleDeleteCard = useMemo(
    () =>
      makeRoomAction((cardId: string) => hub.deleteCard(cardId), {
        t,
        errorKey: 'kanban.errors.deleteCard',
        setRoom,
        setError: setSnackbarError,
        onStart: (cardId) => setPendingCardId(cardId),
        onEnd: () => setPendingCardId(null),
      }),
    [setRoom, t],
  );

  const adminActions = useRoomAdminActions<RoomState>({
    hub: {
      makeAdmin: hub.makeAdmin,
      removeAdmin: hub.removeAdmin,
      removeParticipant: hub.removeParticipant,
      updateRoomPassword: hub.updateRoomPassword,
    },
    setRoom,
    t,
    errorKeyPrefix: 'kanban.errors',
    setActionError,
    setSnackbarError,
    clearErrors: () => {
      setActionError(null);
      setSnackbarError(null);
    },
  });

  return {
    actionError,
    setActionError,
    snackbarError,
    setSnackbarError,
    clearErrors: () => {
      setActionError(null);
      setSnackbarError(null);
    },
    pendingColumnId,
    pendingCardId,
    pendingMakeAdminId: adminActions.pendingMakeAdminId,
    pendingRemoveAdminId: adminActions.pendingRemoveAdminId,
    handleAddColumn,
    handleUpdateColumn,
    handleDeleteColumn,
    handleReorderColumns,
    handleAddCard,
    handleAssignCard,
    handleUpdateCard,
    handleMoveCard,
    handleDeleteCard,
    handleUpdatePassword: adminActions.handleUpdatePassword,
    handleMakeAdmin: adminActions.handleMakeAdmin,
    handleRemoveAdmin: adminActions.handleRemoveAdmin,
  };
}
