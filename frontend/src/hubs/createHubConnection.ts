import { HubConnectionBuilder, HubConnectionState, type HubConnection } from '@microsoft/signalr';
import type { ConnectionState } from '../stores/createRoomStore';
import i18n from '../i18n/config';

export interface HubListeners<TState> {
  onRoomUpdated?: (room: TState, prevRoom: TState | null) => void;
  onRoomClosed?: (message: string) => void;
  onYouWereRemoved?: (message: string) => void;
  registerHandlers?: (connection: HubConnection) => void;
}

export interface ConnectionActions {
  setConnectionState: (state: ConnectionState) => void;
  setError: (error: string | null) => void;
  clearRoom: () => void;
  setLastPassword: (password: string | null) => void;
}

export interface HubConnectionApi<TState> {
  ensureConnected: () => Promise<void>;
  invoke: <T>(method: string, ...args: unknown[]) => Promise<T>;
  disconnect: () => Promise<void>;
  leaveRoom: (getRoomId: () => string | undefined) => Promise<void>;
  joinRoom: (roomId: string, password?: string) => Promise<TState>;
  updateRoomPassword: (getRoomId: () => string | undefined, password?: string) => Promise<TState>;
  makeAdmin: (getRoomId: () => string | undefined, participantId: string) => Promise<TState>;
  removeAdmin: (getRoomId: () => string | undefined, participantId: string) => Promise<TState>;
  removeParticipant: (
    getRoomId: () => string | undefined,
    participantId: string,
  ) => Promise<TState>;
}

export function createHubConnection<TState>(
  hubUrl: string,
  listeners: HubListeners<TState>,
  actions: ConnectionActions,
  getRoomId: () => string | undefined,
  getOwnParticipantId: () => string | undefined,
  setRoom: (room: TState) => void,
  getRoom: () => TState | null,
  getLastPassword: () => string | null = () => null,
): HubConnectionApi<TState> {
  let connection: HubConnection | null = null;
  let connectingPromise: Promise<void> | null = null;

  function getConnection(): HubConnection {
    if (connection) return connection;

    const conn = new HubConnectionBuilder()
      .withUrl(hubUrl, { withCredentials: true })
      .withAutomaticReconnect([1000, 2000, 5000, 10000, 30000])
      .build();

    conn.on('RoomUpdated', (room: TState) => {
      const prevRoom = getRoom();
      setRoom(room);
      actions.setError(null);
      listeners.onRoomUpdated?.(room, prevRoom);
    });

    conn.on('RoomClosed', (message: string) => {
      listeners.onRoomClosed?.(message);
    });

    conn.on('YouWereRemoved', (message: string) => {
      listeners.onYouWereRemoved?.(message);
    });

    conn.onreconnecting(() => {
      actions.setConnectionState('connecting');
    });

    conn.onreconnected(async () => {
      const roomId = getRoomId();
      const participantId = getOwnParticipantId();
      if (roomId && participantId) {
        try {
          const password = getLastPassword();
          const room = await conn.invoke<TState>('JoinRoom', roomId, password);
          setRoom(room);
          actions.setConnectionState('connected');
          actions.setError(null);
        } catch {
          actions.clearRoom();
          actions.setConnectionState('disconnected');
        }
      }
    });

    conn.onclose(() => {
      actions.setConnectionState('disconnected');
    });

    listeners.registerHandlers?.(conn);

    connection = conn;
    return conn;
  }

  async function ensureConnected(): Promise<void> {
    const conn = getConnection();

    if (conn.state === HubConnectionState.Connected) return;

    if (connectingPromise) {
      await connectingPromise;
      return;
    }

    actions.setConnectionState('connecting');
    const promise = conn
      .start()
      .then(() => {
        actions.setConnectionState('connected');
        actions.setError(null);
      })
      .catch((err: unknown) => {
        actions.setConnectionState('disconnected');
        const message = err instanceof Error ? err.message : i18n.t('hub.failedToConnect');
        actions.setError(message);
        throw err;
      })
      .finally(() => {
        connectingPromise = null;
      });

    connectingPromise = promise;
    await promise;
  }

  async function invokeGuard<T>(method: string, ...args: unknown[]): Promise<T> {
    const conn = connection;
    if (!conn || conn.state !== HubConnectionState.Connected) {
      throw new Error('Not connected');
    }
    return conn.invoke<T>(method, ...args);
  }

  return {
    ensureConnected,
    invoke: invokeGuard,
    disconnect: async () => {
      if (!connection) return;
      await connection.stop();
      actions.setConnectionState('disconnected');
      connection = null;
      connectingPromise = null;
    },
    leaveRoom: async (getRoomId) => {
      const roomId = getRoomId();
      if (!roomId) return;
      try {
        await invokeGuard('LeaveRoom', roomId);
      } finally {
        actions.clearRoom();
      }
    },
    joinRoom: async (roomId: string, password?: string) => {
      await ensureConnected();
      const room = await invokeGuard<TState>('JoinRoom', roomId, password ?? null);
      actions.setLastPassword(password ?? null);
      return room;
    },
    updateRoomPassword: async (getRoomId, password?) => {
      const roomId = getRoomId();
      if (!roomId) throw new Error(i18n.t('hub.notInRoom'));
      return invokeGuard<TState>('UpdateRoomPassword', roomId, password ?? null);
    },
    makeAdmin: async (getRoomId, participantId) => {
      const roomId = getRoomId();
      if (!roomId) throw new Error(i18n.t('hub.notInRoom'));
      return invokeGuard<TState>('MakeAdmin', roomId, participantId);
    },
    removeAdmin: async (getRoomId, participantId) => {
      const roomId = getRoomId();
      if (!roomId) throw new Error(i18n.t('hub.notInRoom'));
      return invokeGuard<TState>('RemoveAdmin', roomId, participantId);
    },
    removeParticipant: async (getRoomId, participantId) => {
      const roomId = getRoomId();
      if (!roomId) throw new Error(i18n.t('hub.notInRoom'));
      return invokeGuard<TState>('RemoveParticipant', roomId, participantId);
    },
  };
}
