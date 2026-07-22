import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { RequireRoomPassword } from '../room-lobby/RequireRoomPassword';
import { NotFoundPage } from '../../features/error/pages/NotFoundPage';
import type { ConnectionState } from '../../stores/createRoomStore';

interface RoomStateBase {
  id: string;
  ownParticipantId: string;
  version: number;
}

interface RoomGateStore<TState extends RoomStateBase> {
  room: TState | null;
  setRoom: (room: TState) => void;
  setError: (error: string | null) => void;
  connectionState: ConnectionState;
}

interface RoomGateProps<TState extends RoomStateBase> {
  featureKey: string;
  lobbyPath: string;
  useStore: {
    <U>(selector: (state: RoomGateStore<TState>) => U): U;
    getState: () => RoomGateStore<TState>;
  };
  joinRoom: (roomId: string, password?: string) => Promise<TState>;
  children: React.ReactNode;
}

export function RoomGate<TState extends RoomStateBase>({
  featureKey,
  lobbyPath,
  useStore,
  joinRoom,
  children,
}: RoomGateProps<TState>) {
  const { roomId } = useParams<{ roomId: string }>();
  const room = useStore((s) => s.room);

  const setRoom = useCallback(
    (room: TState) => {
      useStore.getState().setRoom(room);
    },
    [useStore],
  );

  const setStoreError = useCallback(
    (e: string | null) => {
      useStore.getState().setError(e);
    },
    [useStore],
  );

  if (!roomId) return <NotFoundPage />;
  if (room?.id === roomId) return <>{children}</>;

  return (
    <RequireRoomPassword
      roomId={roomId}
      joinRoom={joinRoom}
      setRoom={setRoom}
      setStoreError={setStoreError}
      lobbyPath={lobbyPath}
      i18nPrefix={featureKey}
      getRoom={() => useStore.getState().room}
    >
      {children}
    </RequireRoomPassword>
  );
}
