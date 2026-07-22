import type { HubConnection } from '@microsoft/signalr';
import { createFeatureHub } from '../../hubs/createFeatureHub';
import { usePlanningPokerStore, type RoomState, type VoteResult } from './store/planningPokerStore';
import type {
  VoteUpdatePayload,
  VoteRevealedPayload,
  VoteItemAddedPayload,
  VoteItemDeletedPayload,
  VotesResetPayload,
  VoteHiddenPayload,
} from './store/planningPokerStore';
import { queryClient } from '../../queryClient';
import { planningPoker } from '../../api/queryKeys';

async function requestFullState(connection: HubConnection): Promise<void> {
  const store = usePlanningPokerStore.getState();
  const { room } = store;
  if (!room) return;
  try {
    const state = await connection.invoke<RoomState>('GetFullState', room.id);
    store.setRoom(state);
  } catch {
    // fallback — keep current state
  }
}

function handleDelta<T>(
  connection: HubConnection,
  payload: T & { version: number },
  apply: (payload: T) => void,
): void {
  const store = usePlanningPokerStore.getState();
  if (payload.version !== store.lastVersion + 1) {
    requestFullState(connection);
    return;
  }
  apply(payload);
  usePlanningPokerStore.setState({ lastVersion: payload.version });
}

function createDeltaHandler<T extends { version: number }>(
  connection: HubConnection,
  apply: (payload: T) => void,
) {
  return (payload: T) =>
    handleDelta(connection, payload, (p) => {
      apply(p);
      const room = usePlanningPokerStore.getState().room;
      if (room) {
        queryClient.invalidateQueries({ queryKey: planningPoker.results(room.id) });
      }
    });
}

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
} = createFeatureHub<RoomState>('/hubs/planning-poker', usePlanningPokerStore, {
  onRoomUpdated: (room, prevRoom) => {
    if (
      prevRoom &&
      room.voteItems.some((vi, i) => vi.isRevealed !== prevRoom.voteItems[i]?.isRevealed)
    ) {
      queryClient.invalidateQueries({ queryKey: planningPoker.results(room.id) });
    }
  },
  registerHandlers: (connection) => {
    connection.on('FocusVoteItem', (voteItemId: string) => {
      usePlanningPokerStore.getState().setSelectedVoteItemId(voteItemId);
    });

    connection.on('VoteUpdated', (payload: VoteUpdatePayload) => {
      usePlanningPokerStore.setState({ lastVersion: payload.version });
      requestFullState(connection);
    });

    connection.on(
      'VoteRevealed',
      createDeltaHandler(connection, (p: VoteRevealedPayload) => {
        usePlanningPokerStore.getState().applyVoteRevealed(p);
      }),
    );

    connection.on(
      'VoteItemAdded',
      createDeltaHandler(connection, (p: VoteItemAddedPayload) => {
        usePlanningPokerStore.getState().applyVoteItemAdded(p);
      }),
    );

    connection.on(
      'VoteItemDeleted',
      createDeltaHandler(connection, (p: VoteItemDeletedPayload) => {
        usePlanningPokerStore.getState().applyVoteItemDeleted(p);
      }),
    );

    connection.on(
      'VotesReset',
      createDeltaHandler(connection, (p: VotesResetPayload) => {
        usePlanningPokerStore.getState().applyVotesReset(p);
      }),
    );

    connection.on('VoteHidden', (payload: VoteHiddenPayload) => {
      handleDelta(connection, payload, (p) => {
        usePlanningPokerStore.getState().applyVotesHidden(p);
      });
    });
  },
});

export const addVoteItem = (title: string) => hubInvoke<RoomState>('AddVoteItem', title);
export const vote = (voteItemId: string, value: string) =>
  hubInvoke<VoteResult>('Vote', voteItemId, value);
export const revealVotes = (voteItemId: string) => hubInvoke<void>('RevealVotes', voteItemId);
export const resetVotes = (voteItemId: string) => hubInvoke<void>('ResetVotes', voteItemId);
export const hideVotes = (voteItemId: string) => hubInvoke<void>('HideVotes', voteItemId);
export const focusVoteItem = (voteItemId: string) => hubInvoke<void>('FocusVoteItem', voteItemId);
export const deleteVoteItem = (voteItemId: string) =>
  hubInvoke<RoomState>('DeleteVoteItem', voteItemId);
