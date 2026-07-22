import { create } from 'zustand';
import { createBaseRoomSlice } from '../../../stores/createRoomStore';
import type { BaseRoomState, BaseRoomActions } from '../../../stores/createRoomStore';
import type { RoomParticipant } from '../../../types/models/participant';
import i18n from '../../../i18n/config';
import type { RoomState } from '../../../types/models/planning-poker';

export type Participant = RoomParticipant;

export interface Vote {
  participantId: string;
  participantName: string;
  value: string | null;
}

export interface VoteItemState {
  id: string;
  title: string;
  isRevealed: boolean;
  votes: Vote[];
}

export type { RoomState };

// Delta payload types (from server)
// Note: value is intentionally omitted from VoteUpdatePayload to prevent
// leaking hidden votes before reveal. Clients request full state instead.
export interface VoteUpdatePayload {
  voteItemId: string;
  version: number;
}

export interface VoteRevealedPayload {
  voteItemId: string;
  version: number;
}

export interface VoteItemAddedPayload {
  voteItemId: string;
  title: string;
  version: number;
}

export interface VoteItemDeletedPayload {
  voteItemId: string;
  version: number;
}

export interface VotesResetPayload {
  voteItemId: string;
  version: number;
}

export interface VoteHiddenPayload {
  voteItemId: string;
  version: number;
}

export interface VoteResult {
  state: RoomState;
  version: number;
}

export interface PlanningPokerState extends BaseRoomState<RoomState>, BaseRoomActions<RoomState> {
  selectedVoteItemId: string | null;

  optimisticVote: (voteItemId: string, value: string) => void;
  optimisticRevealVotes: (voteItemId: string) => void;
  optimisticHideVotes: (voteItemId: string) => void;
  optimisticResetVotes: (voteItemId: string) => void;

  setSelectedVoteItemId: (id: string | null) => void;

  applyVoteRevealed: (payload: VoteRevealedPayload) => void;
  applyVoteItemAdded: (payload: VoteItemAddedPayload) => void;
  applyVoteItemDeleted: (payload: VoteItemDeletedPayload) => void;
  applyVotesReset: (payload: VotesResetPayload) => void;
  applyVotesHidden: (payload: VoteHiddenPayload) => void;
}

export const usePlanningPokerStore = create<PlanningPokerState>((set) => ({
  ...createBaseRoomSlice<RoomState>()(set, {
    onCloseRoom: () => ({ selectedVoteItemId: null }),
    onClearRoom: () => ({ selectedVoteItemId: null }),
  }),

  selectedVoteItemId: null,

  optimisticVote: (voteItemId, value) =>
    set((state) => {
      if (!state.room) return state;
      const ownParticipantId = state.room.ownParticipantId;
      const ownParticipant = state.room.participants.find((p) => p.id === ownParticipantId);
      const participantName = ownParticipant?.displayName ?? i18n.t('common.anonymous');

      return {
        room: {
          ...state.room,
          voteItems: state.room.voteItems.map((vi) => {
            if (vi.id !== voteItemId || vi.isRevealed) return vi;
            const otherVotes = vi.votes.filter((v) => v.participantId !== ownParticipantId);
            return {
              ...vi,
              votes: [...otherVotes, { participantId: ownParticipantId, participantName, value }],
            };
          }),
        },
      };
    }),

  optimisticRevealVotes: (voteItemId) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          voteItems: state.room.voteItems.map((vi) =>
            vi.id === voteItemId ? { ...vi, isRevealed: true } : vi,
          ),
        },
      };
    }),

  optimisticHideVotes: (voteItemId) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          voteItems: state.room.voteItems.map((vi) =>
            vi.id === voteItemId ? { ...vi, isRevealed: false } : vi,
          ),
        },
      };
    }),

  optimisticResetVotes: (voteItemId) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          voteItems: state.room.voteItems.map((vi) =>
            vi.id === voteItemId ? { ...vi, isRevealed: false, votes: [] } : vi,
          ),
        },
      };
    }),

  setSelectedVoteItemId: (id) => set({ selectedVoteItemId: id }),

  applyVoteRevealed: (payload) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          voteItems: state.room.voteItems.map((vi) =>
            vi.id === payload.voteItemId ? { ...vi, isRevealed: true } : vi,
          ),
        },
      };
    }),

  applyVoteItemAdded: (payload) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          voteItems: [
            ...state.room.voteItems,
            { id: payload.voteItemId, title: payload.title, isRevealed: false, votes: [] },
          ],
        },
      };
    }),

  applyVoteItemDeleted: (payload) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          voteItems: state.room.voteItems.filter((vi) => vi.id !== payload.voteItemId),
        },
      };
    }),

  applyVotesReset: (payload) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          voteItems: state.room.voteItems.map((vi) =>
            vi.id === payload.voteItemId ? { ...vi, isRevealed: false, votes: [] } : vi,
          ),
        },
      };
    }),

  applyVotesHidden: (payload) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          voteItems: state.room.voteItems.map((vi) =>
            vi.id === payload.voteItemId ? { ...vi, isRevealed: false } : vi,
          ),
        },
      };
    }),
}));
