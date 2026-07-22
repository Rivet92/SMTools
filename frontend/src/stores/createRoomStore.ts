export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface BaseRoomState<TRoom> {
  connectionState: ConnectionState;
  error: string | null;
  roomClosedMessage: string | null;
  room: TRoom | null;
  lastPassword: string | null;
  lastVersion: number;
}

export interface BaseRoomActions<TRoom extends { ownParticipantId: string; version: number }> {
  setConnectionState: (state: ConnectionState) => void;
  setError: (error: string | null) => void;
  setRoomClosedMessage: (message: string | null) => void;
  closeRoom: (message: string) => void;
  setRoom: (room: TRoom) => void;
  clearRoom: () => void;
  setLastPassword: (password: string | null) => void;
}

type BaseRoomSlice<TRoom extends { ownParticipantId: string; version: number }> =
  BaseRoomState<TRoom> & BaseRoomActions<TRoom>;

type BaseSet<TRoom extends { ownParticipantId: string; version: number }> = {
  (partial: Partial<BaseRoomSlice<TRoom>>): void;
  (partial: (state: BaseRoomSlice<TRoom>) => Partial<BaseRoomSlice<TRoom>>): void;
};

export interface BaseRoomSliceOptions {
  onCloseRoom?: () => Record<string, unknown>;
  onClearRoom?: () => Record<string, unknown>;
}

export function createBaseRoomSlice<TRoom extends { ownParticipantId: string; version: number }>() {
  return (set: BaseSet<TRoom>, options?: BaseRoomSliceOptions): BaseRoomSlice<TRoom> => ({
    connectionState: 'disconnected' as ConnectionState,
    error: null,
    roomClosedMessage: null,
    room: null,
    lastPassword: null,
    lastVersion: 0,

    setConnectionState: (connectionState: ConnectionState) => set({ connectionState }),
    setError: (error: string | null) => set({ error }),
    setRoomClosedMessage: (roomClosedMessage: string | null) => set({ roomClosedMessage }),

    closeRoom: (message: string) =>
      set({
        room: null,
        roomClosedMessage: message,
        connectionState: 'disconnected' as ConnectionState,
        lastVersion: 0,
        ...options?.onCloseRoom?.(),
      }),

    setRoom: (room: TRoom) =>
      set((state) => {
        if (!room) return {};
        const ownParticipantId = state.room?.ownParticipantId ?? room.ownParticipantId;
        if (state.room && room.version <= state.room.version) return {};
        return { room: { ...room, ownParticipantId }, lastVersion: room.version };
      }),

    clearRoom: () =>
      set({
        room: null,
        roomClosedMessage: null,
        lastPassword: null,
        lastVersion: 0,
        ...options?.onClearRoom?.(),
      }),

    setLastPassword: (lastPassword: string | null) => set({ lastPassword }),
  });
}
