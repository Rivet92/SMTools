import { create } from 'zustand';
import { createBaseRoomSlice } from '../../../stores/createRoomStore';
import type { BaseRoomState, BaseRoomActions } from '../../../stores/createRoomStore';
import type {
  KanbanParticipant,
  KanbanColumn,
  KanbanCardComment,
  KanbanCard,
} from '../../../types/models/kanban';
import type { RoomState } from '../../../types/models/kanban';

export type Participant = KanbanParticipant;
export type Column = KanbanColumn;
export type Comment = KanbanCardComment;
export type Card = KanbanCard;
export type { RoomState };

export interface KanbanState extends BaseRoomState<RoomState>, BaseRoomActions<RoomState> {}

export const useKanbanStore = create<KanbanState>((set) => ({
  ...createBaseRoomSlice<RoomState>()(set),
}));
