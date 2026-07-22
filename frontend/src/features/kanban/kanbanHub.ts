import { createFeatureHub } from '../../hubs/createFeatureHub';
import { useKanbanStore, type RoomState } from './store/kanbanStore';

export const {
  ensureConnected, invoke, joinRoom, leaveRoom, disconnect,
  updateRoomPassword, makeAdmin, removeAdmin, removeParticipant,
  guardedInvoke: hubInvoke,
} = createFeatureHub<RoomState>('/hubs/kanban', useKanbanStore);

export const addColumn = (title: string, description?: string) =>
  hubInvoke<RoomState>('AddColumn', title, description ?? null);
export const updateColumn = (columnId: string, title: string, description?: string) =>
  hubInvoke<RoomState>('UpdateColumn', columnId, title, description ?? null);
export const deleteColumn = (columnId: string, targetColumnId?: string) =>
  hubInvoke<RoomState>('DeleteColumn', columnId, targetColumnId ?? null);
export const reorderColumns = (columnIds: string[]) =>
  hubInvoke<RoomState>('ReorderColumns', columnIds);
export const addCard = (
  columnId: string,
  title: string,
  description?: string,
  repoUrl?: string,
  repoBranch?: string,
  initialEstimation?: number,
  remaining?: number,
  dueAt?: string,
  assignedParticipantId?: string,
) =>
  hubInvoke<RoomState>(
    'AddCard',
    columnId,
    title,
    description ?? null,
    repoUrl ?? null,
    repoBranch ?? null,
    initialEstimation ?? null,
    remaining ?? null,
    dueAt ?? null,
    assignedParticipantId ?? null,
  );
export const updateCard = (
  cardId: string,
  title: string,
  description?: string,
  repoUrl?: string,
  repoBranch?: string,
  initialEstimation?: number,
  remaining?: number,
  dueAt?: string,
  assignedParticipantId?: string,
) =>
  hubInvoke<RoomState>(
    'UpdateCard',
    cardId,
    title,
    description ?? null,
    repoUrl ?? null,
    repoBranch ?? null,
    initialEstimation ?? null,
    remaining ?? null,
    dueAt ?? null,
    assignedParticipantId ?? null,
  );
export const moveCard = (cardId: string, columnId: string, displayOrder: number) =>
  hubInvoke<RoomState>('MoveCard', cardId, columnId, displayOrder);
export const assignCard = (cardId: string, assignedParticipantId: string | null) =>
  hubInvoke<RoomState>('AssignCard', cardId, assignedParticipantId);
export const addComment = (cardId: string, content: string) =>
  hubInvoke<RoomState>('AddComment', cardId, content);
export const updateComment = (cardId: string, commentId: string, content: string) =>
  hubInvoke<RoomState>('UpdateComment', cardId, commentId, content);
export const deleteComment = (cardId: string, commentId: string) =>
  hubInvoke<RoomState>('DeleteComment', cardId, commentId);
export const deleteCard = (cardId: string) => hubInvoke<RoomState>('DeleteCard', cardId);
