import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHubConnection } from '../createHubConnection';

const [mockConnection] = vi.hoisted(() => {
  return [
    {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      off: vi.fn(),
      invoke: vi.fn().mockResolvedValue(undefined),
      onreconnecting: vi.fn(),
      onreconnected: vi.fn(),
      onclose: vi.fn(),
      state: 0,
    },
  ];
});

vi.mock('@microsoft/signalr', () => {
  const HubConnectionStateEnum = { Disconnected: 0, Connected: 1, Connecting: 2, Reconnecting: 3 };
  return {
    HubConnectionBuilder: vi.fn().mockImplementation(() => ({
      withUrl: vi.fn().mockReturnThis(),
      withAutomaticReconnect: vi.fn().mockReturnThis(),
      configureLogging: vi.fn().mockReturnThis(),
      build: vi.fn().mockReturnValue(mockConnection),
    })),
    HubConnectionState: HubConnectionStateEnum,
    LogLevel: { Information: 2 },
  };
});

const createActions = () => ({
  setConnectionState: vi.fn(),
  setError: vi.fn(),
  clearRoom: vi.fn(),
  setLastPassword: vi.fn(),
});

const createListeners = () => ({
  onRoomUpdated: vi.fn(),
  onRoomClosed: vi.fn(),
  onYouWereRemoved: vi.fn(),
  registerHandlers: vi.fn(),
});

describe('createHubConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnection.state = 0;
    mockConnection.start.mockResolvedValue(undefined);
    mockConnection.stop.mockResolvedValue(undefined);
    mockConnection.invoke.mockResolvedValue(undefined);
  });

  it('creates a connection with the given URL', () => {
    const hub = createHubConnection(
      '/hubs/test',
      {},
      createActions(),
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );
    expect(hub).toBeDefined();
    expect(hub.ensureConnected).toBeDefined();
    expect(hub.invoke).toBeDefined();
    expect(hub.disconnect).toBeDefined();
    expect(hub.leaveRoom).toBeDefined();
    expect(hub.joinRoom).toBeDefined();
    expect(hub.updateRoomPassword).toBeDefined();
    expect(hub.makeAdmin).toBeDefined();
    expect(hub.removeAdmin).toBeDefined();
    expect(hub.removeParticipant).toBeDefined();
  });

  it('ensureConnected starts the connection if disconnected', async () => {
    const actions = createActions();
    const hub = createHubConnection(
      '/hubs/test',
      {},
      actions,
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );

    await hub.ensureConnected();

    expect(mockConnection.start).toHaveBeenCalledTimes(1);
    expect(actions.setConnectionState).toHaveBeenCalledWith('connecting');
    expect(actions.setConnectionState).toHaveBeenCalledWith('connected');
  });

  it('does not start a new connection if already connected', async () => {
    mockConnection.state = 1;
    const actions = createActions();
    const hub = createHubConnection(
      '/hubs/test',
      {},
      actions,
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );

    await hub.ensureConnected();

    expect(mockConnection.start).not.toHaveBeenCalled();
    expect(actions.setConnectionState).not.toHaveBeenCalled();
  });

  it('calls setError and throws on connection failure', async () => {
    const error = new Error('Connection failed');
    mockConnection.start.mockRejectedValue(error);
    const actions = createActions();
    const hub = createHubConnection(
      '/hubs/test',
      {},
      actions,
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );

    await expect(hub.ensureConnected()).rejects.toThrow('Connection failed');
    expect(actions.setError).toHaveBeenCalledWith('Connection failed');
    expect(actions.setConnectionState).toHaveBeenCalledWith('disconnected');
  });

  it('invokeGuard throws if not connected', async () => {
    const hub = createHubConnection(
      '/hubs/test',
      {},
      createActions(),
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );

    await expect(hub.invoke('SomeMethod')).rejects.toThrow('Not connected');
  });

  it('invokeGuard calls conn.invoke when connected', async () => {
    mockConnection.state = 1;
    mockConnection.invoke.mockResolvedValue('result');
    const hub = createHubConnection(
      '/hubs/test',
      {},
      createActions(),
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );

    await hub.ensureConnected();

    mockConnection.state = 1;
    const result = await hub.invoke<string>('SomeMethod', 'arg1');

    expect(mockConnection.invoke).toHaveBeenCalledWith('SomeMethod', 'arg1');
    expect(result).toBe('result');
  });

  it('disconnect stops the connection and clears state', async () => {
    const actions = createActions();
    const hub = createHubConnection(
      '/hubs/test',
      {},
      actions,
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );
    await hub.ensureConnected();

    await hub.disconnect();

    expect(mockConnection.stop).toHaveBeenCalled();
    expect(actions.setConnectionState).toHaveBeenCalledWith('disconnected');
  });

  it('disconnect does nothing if no connection', async () => {
    const actions = createActions();
    const hub = createHubConnection(
      '/hubs/test',
      {},
      actions,
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );

    await hub.disconnect();

    expect(mockConnection.stop).not.toHaveBeenCalled();
    expect(actions.setConnectionState).not.toHaveBeenCalledWith('disconnected');
  });

  it('leaveRoom invokes LeaveRoom and clears room', async () => {
    mockConnection.state = 1;
    const actions = createActions();
    const hub = createHubConnection(
      '/hubs/test',
      {},
      actions,
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );
    await hub.ensureConnected();

    mockConnection.state = 1;
    await hub.leaveRoom(() => 'room-1');

    expect(mockConnection.invoke).toHaveBeenCalledWith('LeaveRoom', 'room-1');
    expect(actions.clearRoom).toHaveBeenCalled();
  });

  it('leaveRoom does nothing if no roomId', async () => {
    mockConnection.state = 1;
    const actions = createActions();
    const hub = createHubConnection(
      '/hubs/test',
      {},
      actions,
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );
    await hub.ensureConnected();

    await hub.leaveRoom(() => undefined);

    expect(mockConnection.invoke).not.toHaveBeenCalled();
    expect(actions.clearRoom).not.toHaveBeenCalled();
  });

  it('joinRoom ensures connection and invokes JoinRoom', async () => {
    mockConnection.invoke.mockResolvedValue({ id: 'room-1' });
    mockConnection.state = 1;
    const actions = createActions();
    const hub = createHubConnection(
      '/hubs/test',
      {},
      actions,
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );
    await hub.ensureConnected();

    mockConnection.state = 1;
    const room = await hub.joinRoom('room-1', 'password');

    expect(mockConnection.invoke).toHaveBeenCalledWith('JoinRoom', 'room-1', 'password');
    expect(room).toEqual({ id: 'room-1' });
    expect(actions.setLastPassword).toHaveBeenCalledWith('password');
  });

  it('registers connection event handlers after ensureConnected', async () => {
    const hub = createHubConnection(
      '/hubs/test',
      {},
      createActions(),
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );
    await hub.ensureConnected();

    expect(mockConnection.onreconnecting).toHaveBeenCalled();
    expect(mockConnection.onreconnected).toHaveBeenCalled();
    expect(mockConnection.onclose).toHaveBeenCalled();
    expect(mockConnection.on).toHaveBeenCalledWith('RoomUpdated', expect.any(Function));
    expect(mockConnection.on).toHaveBeenCalledWith('RoomClosed', expect.any(Function));
    expect(mockConnection.on).toHaveBeenCalledWith('YouWereRemoved', expect.any(Function));
  });

  it('onreconnected rejoins the room', async () => {
    mockConnection.state = 1;
    const actions = createActions();
    const setRoom = vi.fn();
    const hub = createHubConnection(
      '/hubs/test',
      {},
      actions,
      () => 'room-1',
      () => 'participant-1',
      setRoom,
      () => null,
      () => 'my-password',
    );
    await hub.ensureConnected();

    const reconnectedFn = mockConnection.onreconnected.mock.calls[0]![0];
    mockConnection.invoke.mockResolvedValue({ id: 'room-1' });

    await reconnectedFn();

    expect(mockConnection.invoke).toHaveBeenCalledWith('JoinRoom', 'room-1', 'my-password');
    expect(setRoom).toHaveBeenCalledWith({ id: 'room-1' });
    expect(actions.setConnectionState).toHaveBeenCalledWith('connected');
    expect(actions.setError).toHaveBeenCalledWith(null);
  });

  it('onreconnected clears room if rejoin fails', async () => {
    mockConnection.state = 1;
    const actions = createActions();
    const setRoom = vi.fn();
    const hub = createHubConnection(
      '/hubs/test',
      {},
      actions,
      () => 'room-1',
      () => 'participant-1',
      setRoom,
      () => null,
      () => 'my-password',
    );
    await hub.ensureConnected();

    const reconnectedFn = mockConnection.onreconnected.mock.calls[0]![0];
    mockConnection.invoke.mockRejectedValue(new Error('Room closed'));

    await reconnectedFn();

    expect(actions.clearRoom).toHaveBeenCalled();
    expect(actions.setConnectionState).toHaveBeenCalledWith('disconnected');
  });

  it('onreconnecting sets connection state to connecting', async () => {
    const actions = createActions();
    const hub = createHubConnection(
      '/hubs/test',
      {},
      actions,
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );
    await hub.ensureConnected();

    const handler = mockConnection.onreconnecting.mock.calls[0]![0];
    handler();
    expect(actions.setConnectionState).toHaveBeenCalledWith('connecting');
  });

  it('onclose sets connection state to disconnected', async () => {
    const actions = createActions();
    const hub = createHubConnection(
      '/hubs/test',
      {},
      actions,
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );
    await hub.ensureConnected();

    mockConnection.onclose.mock.calls[0]![0]();
    expect(actions.setConnectionState).toHaveBeenCalledWith('disconnected');
  });

  it('registerHandlers is called with the connection', async () => {
    const listeners = createListeners();
    const hub = createHubConnection(
      '/hubs/test',
      listeners,
      createActions(),
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );
    await hub.ensureConnected();

    expect(listeners.registerHandlers).toHaveBeenCalled();
    const handlerArg = listeners.registerHandlers.mock.calls[0]![0];
    expect(handlerArg).toBeDefined();
  });

  it('registers RoomUpdated handler that calls setRoom', async () => {
    const setRoom = vi.fn();
    const listeners = createListeners();
    const hub = createHubConnection(
      '/hubs/test',
      listeners,
      createActions(),
      () => undefined,
      () => undefined,
      setRoom,
      () => null,
    );
    await hub.ensureConnected();

    const handler = mockConnection.on.mock.calls.find(
      (call: unknown[]) => call[0] === 'RoomUpdated',
    )?.[1];
    expect(handler).toBeDefined();
    handler?.({ id: 'room-1' });
    expect(setRoom).toHaveBeenCalledWith({ id: 'room-1' });
  });

  it('registers RoomClosed handler', async () => {
    const listeners = createListeners();
    const hub = createHubConnection(
      '/hubs/test',
      listeners,
      createActions(),
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );
    await hub.ensureConnected();

    const handler = mockConnection.on.mock.calls.find(
      (call: unknown[]) => call[0] === 'RoomClosed',
    )?.[1];
    expect(handler).toBeDefined();
  });

  it('registers YouWereRemoved handler', async () => {
    const listeners = createListeners();
    const hub = createHubConnection(
      '/hubs/test',
      listeners,
      createActions(),
      () => undefined,
      () => undefined,
      vi.fn(),
      () => null,
    );
    await hub.ensureConnected();

    const handler = mockConnection.on.mock.calls.find(
      (call: unknown[]) => call[0] === 'YouWereRemoved',
    )?.[1];
    expect(handler).toBeDefined();
  });
});
