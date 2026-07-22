import { createFeatureHub } from '../../hubs/createFeatureHub';
import { useRetroStore, type RoomState } from './store/retroStore';
import { queryClient } from '../../queryClient';

export const {
  ensureConnected,
  invoke,
  joinRoom,
  leaveRoom,
  disconnect,
  updateRoomPassword,
  makeAdmin,
  removeAdmin,
  removeParticipant,
  guardedInvoke: hubInvoke,
} = createFeatureHub<RoomState>('/hubs/retro', useRetroStore, {
  onRoomUpdated: (room, prevRoom) => {
    if (prevRoom && prevRoom.phase !== room.phase) {
      queryClient.invalidateQueries({ queryKey: ['retro-results', room.id] });
    }
  },
});

export const addCard = (columnId: string, content: string) =>
  hubInvoke<RoomState>('AddCard', columnId, content);
export const moveCardToGroup = (cardId: string, groupId?: string) =>
  hubInvoke<RoomState>('MoveCardToGroup', cardId, groupId ?? null);
export const createGroupFromCards = (title: string, firstCardId: string, secondCardId: string) =>
  hubInvoke<RoomState>('CreateGroupFromCards', title, firstCardId, secondCardId);
export const deleteCard = (cardId: string) => hubInvoke<RoomState>('DeleteCard', cardId);
export const addVotePoint = (cardId: string) => hubInvoke<RoomState>('AddVotePoint', cardId);
export const removeVotePoint = (cardId: string) => hubInvoke<RoomState>('RemoveVotePoint', cardId);
export const setPhase = (phase: number) => hubInvoke<RoomState>('SetPhase', phase);
export const addActionItem = (content: string, assigneeParticipantId?: string) =>
  hubInvoke<RoomState>('AddActionItem', content, assigneeParticipantId ?? null);
export const assignActionItem = (actionItemId: string, assigneeParticipantId: string | null) =>
  hubInvoke<RoomState>('AssignActionItem', actionItemId, assigneeParticipantId);
export const deleteActionItem = (actionItemId: string) =>
  hubInvoke<RoomState>('DeleteActionItem', actionItemId);
