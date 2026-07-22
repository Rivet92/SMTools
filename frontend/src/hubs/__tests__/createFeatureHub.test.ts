import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createFeatureHub, type RoomStoreBase } from '../createFeatureHub';
import type { HubListeners, HubConnectionApi } from '../createHubConnection';

const mockConnectionApi: HubConnectionApi<{ id: string; ownParticipantId: string }> = {
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

let capturedListeners: HubListeners<{ id: string; ownParticipantId: string }> | undefined;

vi.mock('../createHubConnection', () => ({
  createHubConnection: <TState>(
    _hubUrl: string,
    listeners: HubListeners<TState>,
  ): HubConnectionApi<TState> => {
    capturedListeners = listeners as unknown as HubListeners<{
      id: string;
      ownParticipantId: string;
    }>;
    return mockConnectionApi as HubConnectionApi<TState>;
  },
}));

describe('createFeatureHub', () => {
  beforeEach(() => {
    capturedListeners = undefined;
  });

  it('sets default onRoomClosed handler', () => {
    const store = create<RoomStoreBase<{ id: string; ownParticipantId: string }>>((set) => ({
      connectionState: 'disconnected',
      error: null,
      roomClosedMessage: null,
      room: null,
      lastPassword: null,
      setConnectionState: () => set({ connectionState: 'connected' }),
      setError: (error) => set({ error }),
      setRoom: () => {},
      clearRoom: () => {},
      setLastPassword: () => {},
      closeRoom: (message) =>
        set({ room: null, roomClosedMessage: message, connectionState: 'disconnected' }),
      setRoomClosedMessage: (message) => set({ roomClosedMessage: message }),
    }));

    createFeatureHub('/hubs/test', store);

    expect(capturedListeners).toBeDefined();
    expect(capturedListeners!.onRoomClosed).toBeDefined();

    capturedListeners!.onRoomClosed!('Room was closed');

    expect(store.getState().roomClosedMessage).toBe('Room was closed');
    expect(store.getState().room).toBeNull();
    expect(store.getState().connectionState).toBe('disconnected');
  });

  it('allows explicit onRoomClosed to override default', () => {
    const store = create<RoomStoreBase<{ id: string; ownParticipantId: string }>>((set) => ({
      connectionState: 'disconnected',
      error: null,
      roomClosedMessage: null,
      room: null,
      lastPassword: null,
      setConnectionState: vi.fn(),
      setError: vi.fn(),
      setRoom: vi.fn(),
      clearRoom: vi.fn(),
      setLastPassword: vi.fn(),
      closeRoom: vi.fn(),
      setRoomClosedMessage: (message) => set({ roomClosedMessage: message }),
    }));

    const explicitHandler = vi.fn();

    createFeatureHub('/hubs/test', store, {
      onRoomClosed: explicitHandler,
    });

    expect(capturedListeners).toBeDefined();
    capturedListeners!.onRoomClosed!('Custom message');

    expect(explicitHandler).toHaveBeenCalledWith('Custom message');
    expect(store.getState().roomClosedMessage).toBeNull();
  });
});

function createTestStore(
  overrides: Partial<RoomStoreBase<{ id: string; ownParticipantId: string }>> = {},
) {
  return create<RoomStoreBase<{ id: string; ownParticipantId: string }>>((set) => ({
    connectionState: 'disconnected',
    error: null,
    roomClosedMessage: null,
    room: null,
    lastPassword: null,
    setConnectionState: (s) => set({ connectionState: s }),
    setError: (e) => set({ error: e }),
    setRoom: (room) => set({ room }),
    clearRoom: () => set({ room: null, roomClosedMessage: null, lastPassword: null }),
    setLastPassword: (p) => set({ lastPassword: p }),
    closeRoom: (message) =>
      set({ room: null, roomClosedMessage: message, connectionState: 'disconnected' }),
    setRoomClosedMessage: (message) => set({ roomClosedMessage: message }),
    ...overrides,
  }));
}

describe('createFeatureHub - guardedInvoke and requireRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('guardedInvoke invokes with roomId when room exists', async () => {
    (mockConnectionApi.invoke as ReturnType<typeof vi.fn>).mockResolvedValue('ok');
    const store = createTestStore();
    store.setState({ room: { id: 'r1', ownParticipantId: 'p1' } });

    const hub = createFeatureHub('/hubs/test', store);
    const result = await hub.guardedInvoke<string>('SomeMethod', 'arg1');

    expect(mockConnectionApi.invoke).toHaveBeenCalledWith('SomeMethod', 'r1', 'arg1');
    expect(result).toBe('ok');
  });

  it('guardedInvoke throws when not in room', async () => {
    const store = createTestStore();
    const hub = createFeatureHub('/hubs/test', store);

    try {
      await hub.guardedInvoke('SomeMethod');
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as Error).message).toBe('hub.notInRoom');
    }
  });

  it('requireRoom returns roomId when in room', () => {
    const store = createTestStore();
    store.setState({ room: { id: 'r1', ownParticipantId: 'p1' } });

    const hub = createFeatureHub('/hubs/test', store);
    expect(hub.requireRoom()).toBe('r1');
  });

  it('requireRoom throws when not in room', () => {
    const store = createTestStore();
    const hub = createFeatureHub('/hubs/test', store);

    expect(() => hub.requireRoom()).toThrow('hub.notInRoom');
  });
});
