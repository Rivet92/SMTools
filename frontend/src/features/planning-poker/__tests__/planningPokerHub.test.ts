import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HubListeners, HubConnectionApi } from '../../../hubs/createHubConnection';

const mockConnectionApi: HubConnectionApi<{ id: string; ownParticipantId: string; version: number; voteItems: Array<{ id: string; isRevealed: boolean }> }> = {
  ensureConnected: vi.fn(),
  invoke: vi.fn(),
  disconnect: vi.fn(),
  leaveRoom: vi.fn(),
  joinRoom: vi.fn(),
  updateRoomPassword: vi.fn(),
  makeAdmin: vi.fn(),
  removeAdmin: vi.fn(),
  removeParticipant: vi.fn(),
};

let capturedListeners: HubListeners<{ id: string; ownParticipantId: string; version: number; voteItems: Array<{ id: string; isRevealed: boolean }> }> | undefined;

const mockInvalidateQueries = vi.fn();

vi.mock('../../../hubs/createHubConnection', () => ({
  createHubConnection: <TState>(
    _hubUrl: string,
    listeners: HubListeners<TState>,
  ): HubConnectionApi<TState> => {
    capturedListeners = listeners as unknown as HubListeners<{ id: string; ownParticipantId: string; version: number; voteItems: Array<{ id: string; isRevealed: boolean }> }>;
    return mockConnectionApi as HubConnectionApi<TState>;
  },
}));

vi.mock('../../../queryClient', () => ({
  queryClient: {
    invalidateQueries: mockInvalidateQueries,
  },
}));

// Pre-load hub module to populate capturedListeners
const hubModule = await import('../planningPokerHub');

describe('planningPokerHub', () => {
  let mockConnection: { on: ReturnType<typeof vi.fn>; invoke: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    mockConnection = {
      on: vi.fn(),
      invoke: vi.fn(),
    };
  });

  it('registers SignalR event handlers', () => {
    const registerHandlers = capturedListeners?.registerHandlers;
    expect(registerHandlers).toBeDefined();

    if (registerHandlers) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerHandlers(mockConnection as any);
    }

    expect(mockConnection.on).toHaveBeenCalledWith('FocusVoteItem', expect.any(Function));
    expect(mockConnection.on).toHaveBeenCalledWith('VoteUpdated', expect.any(Function));
    expect(mockConnection.on).toHaveBeenCalledWith('VoteRevealed', expect.any(Function));
    expect(mockConnection.on).toHaveBeenCalledWith('VoteItemAdded', expect.any(Function));
    expect(mockConnection.on).toHaveBeenCalledWith('VoteItemDeleted', expect.any(Function));
    expect(mockConnection.on).toHaveBeenCalledWith('VotesReset', expect.any(Function));
    expect(mockConnection.on).toHaveBeenCalledWith('VoteHidden', expect.any(Function));
  });

  it('FocusVoteItem handler sets selectedVoteItemId', async () => {
    const { usePlanningPokerStore } = await import('../store/planningPokerStore');
    usePlanningPokerStore.setState({ selectedVoteItemId: null });

    const registerHandlers = capturedListeners?.registerHandlers;
    expect(registerHandlers).toBeDefined();

    if (registerHandlers) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registerHandlers(mockConnection as any);
    }

    const focusCall = mockConnection.on.mock.calls.find(
      (c) => c[0] === 'FocusVoteItem',
    )!;
    expect(focusCall).toBeDefined();
    const handler = focusCall[1] as (voteItemId: string) => void;
    handler('vi-1');
    expect(usePlanningPokerStore.getState().selectedVoteItemId).toBe('vi-1');
  });

  it('exports function exists', () => {
    expect(hubModule.ensureConnected).toBeDefined();
    expect(hubModule.joinRoom).toBeDefined();
    expect(hubModule.leaveRoom).toBeDefined();
    expect(hubModule.disconnect).toBeDefined();
    expect(hubModule.vote).toBeDefined();
    expect(hubModule.revealVotes).toBeDefined();
    expect(hubModule.resetVotes).toBeDefined();
    expect(hubModule.addVoteItem).toBeDefined();
    expect(hubModule.deleteVoteItem).toBeDefined();
    expect(hubModule.focusVoteItem).toBeDefined();
    expect(hubModule.hideVotes).toBeDefined();
  });

  it('onRoomUpdated invalidates query cache on reveal change', () => {
    const prevRoom = {
      id: 'r1',
      ownParticipantId: 'p1',
      version: 1,
      voteItems: [{ id: 'vi-1', isRevealed: false }],
    };
    const nextRoom = {
      id: 'r1',
      ownParticipantId: 'p1',
      version: 2,
      voteItems: [{ id: 'vi-1', isRevealed: true }],
    };

    capturedListeners?.onRoomUpdated?.(nextRoom, prevRoom);
    expect(mockInvalidateQueries).toHaveBeenCalled();
  });
});
