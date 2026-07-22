import {
  createHubConnection,
  type HubConnectionApi,
  type HubListeners,
} from './createHubConnection';
import type { ConnectionState } from '../stores/createRoomStore';
import i18n from '../i18n/config';

export function parseHubError(error: unknown): { errorCode: string; message: string } | null {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === 'string') {
      try {
        return JSON.parse(msg) as { errorCode: string; message: string };
      } catch {
        const colonIdx = msg.indexOf(':');
        if (colonIdx > 0) {
          return {
            errorCode: msg.substring(0, colonIdx),
            message: msg.substring(colonIdx + 1),
          };
        }
      }
    }
  }
  return null;
}

export interface CommonHubExports<TRoom = unknown> {
  ensureConnected: () => Promise<void>;
  invoke: <T>(method: string, ...args: unknown[]) => Promise<T>;
  joinRoom: (roomId: string, password?: string) => Promise<TRoom>;
  leaveRoom: () => Promise<void>;
  disconnect: () => Promise<void>;
  updateRoomPassword: (password?: string) => Promise<TRoom>;
  makeAdmin: (participantId: string) => Promise<TRoom>;
  removeAdmin: (participantId: string) => Promise<TRoom>;
  removeParticipant: (participantId: string) => Promise<TRoom>;
}

export function createCommonHubExports<TState>(
  hub: FeatureHubApi<TState>,
): CommonHubExports<TState> {
  return {
    ensureConnected: hub.ensureConnected,
    invoke: hub.invoke,
    joinRoom: hub.joinRoom,
    leaveRoom: () => hub.leaveRoom(hub.requireRoom),
    disconnect: hub.disconnect,
    updateRoomPassword: (password?: string) => hub.updateRoomPassword(hub.requireRoom, password),
    makeAdmin: (participantId: string) => hub.makeAdmin(hub.requireRoom, participantId),
    removeAdmin: (participantId: string) => hub.removeAdmin(hub.requireRoom, participantId),
    removeParticipant: (participantId: string) =>
      hub.removeParticipant(hub.requireRoom, participantId),
  };
}

export interface RoomStoreBase<TState> {
  connectionState: ConnectionState;
  error: string | null;
  room: TState | null;
  roomClosedMessage: string | null;
  lastPassword: string | null;
  setConnectionState: (state: ConnectionState) => void;
  setError: (error: string | null) => void;
  setRoom: (room: TState) => void;
  clearRoom: () => void;
  setLastPassword: (password: string | null) => void;
  closeRoom: (message: string) => void;
  setRoomClosedMessage: (message: string | null) => void;
}

export interface FeatureHubApi<TState> extends HubConnectionApi<TState> {
  guardedInvoke: <T>(method: string, ...args: unknown[]) => Promise<T>;
  requireRoom: () => string;
}

export function createFeatureHub<TState extends { id: string; ownParticipantId: string }>(
  hubUrl: string,
  useStore: { getState: () => RoomStoreBase<TState> },
  listeners?: HubListeners<TState>,
) {
  const hub = createHubConnection<TState>(
    hubUrl,
    {
      onRoomClosed: (message) => useStore.getState().closeRoom(message),
      onYouWereRemoved: () => useStore.getState().closeRoom(i18n.t('hub.youWereRemoved')),
      ...listeners,
    },
    {
      setConnectionState: (s) => useStore.getState().setConnectionState(s),
      setError: (e) => useStore.getState().setError(e),
      clearRoom: () => useStore.getState().clearRoom(),
      setLastPassword: (p) => useStore.getState().setLastPassword(p),
    },
    () => useStore.getState().room?.id,
    () => useStore.getState().room?.ownParticipantId,
    (room) => useStore.getState().setRoom(room),
    () => useStore.getState().room ?? null,
    () => useStore.getState().lastPassword,
  );

  const featureHub: FeatureHubApi<TState> = {
    ...hub,
    guardedInvoke: <T>(method: string, ...args: unknown[]) => {
      const roomId = useStore.getState().room?.id;
      if (!roomId) throw new Error(i18n.t('hub.notInRoom'));
      return hub.invoke<T>(method, roomId, ...args);
    },
    requireRoom: () => {
      const roomId = useStore.getState().room?.id;
      if (!roomId) throw new Error(i18n.t('hub.notInRoom'));
      return roomId;
    },
  };

  const common = createCommonHubExports(featureHub);

  return {
    ...featureHub,
    ensureConnected: common.ensureConnected,
    invoke: common.invoke,
    joinRoom: common.joinRoom,
    leaveRoom: common.leaveRoom,
    disconnect: common.disconnect,
    updateRoomPassword: common.updateRoomPassword,
    makeAdmin: common.makeAdmin,
    removeAdmin: common.removeAdmin,
    removeParticipant: common.removeParticipant,
  };
}
