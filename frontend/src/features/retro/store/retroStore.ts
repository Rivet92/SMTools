import { create } from 'zustand';
import { createBaseRoomSlice } from '../../../stores/createRoomStore';
import type { BaseRoomState, BaseRoomActions } from '../../../stores/createRoomStore';
import type { RoomParticipant } from '../../../types/models/participant';
import type { RetroPhase } from '../../../types/models/retro';
import type { RoomState } from '../../../types/models/retro';

export type Participant = RoomParticipant;

export interface Column {
  id: string;
  key: string;
  displayOrder: number;
  color: string;
  icon: string;
}

export interface Card {
  id: string;
  columnId: string;
  groupId: string | null;
  content: string;
  authorParticipantId: string;
  createdAt: string;
  voteCount: number;
  ownVotePoints: number;
}

export interface CardGroup {
  id: string;
  title: string;
  createdAt: string;
  cardIds: string[];
}

export interface ActionItem {
  id: string;
  content: string;
  assigneeParticipantId: string | null;
  createdAt: string;
}

export type { RoomState };

export interface RetroState extends BaseRoomState<RoomState>, BaseRoomActions<RoomState> {
  optimisticVote: (cardId: string) => void;
  optimisticRemoveVote: (cardId: string) => void;
  optimisticSetPhase: (phase: RetroPhase) => void;
}

export const useRetroStore = create<RetroState>((set) => ({
  ...createBaseRoomSlice<RoomState>()(set),

  optimisticVote: (cardId) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          cards: state.room.cards.map((c) =>
            c.id === cardId
              ? { ...c, voteCount: c.voteCount + 1, ownVotePoints: c.ownVotePoints + 1 }
              : c,
          ),
        },
      };
    }),

  optimisticRemoveVote: (cardId) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          cards: state.room.cards.map((c) =>
            c.id === cardId && c.ownVotePoints > 0
              ? {
                  ...c,
                  voteCount: Math.max(0, c.voteCount - 1),
                  ownVotePoints: c.ownVotePoints - 1,
                }
              : c,
          ),
        },
      };
    }),

  optimisticSetPhase: (phase) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: { ...state.room, phase },
      };
    }),
}));
