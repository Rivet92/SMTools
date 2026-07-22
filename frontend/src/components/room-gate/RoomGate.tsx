import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { RequireRoomPassword } from '../room-lobby/RequireRoomPassword';
import type { ConnectionState } from '../../stores/createRoomStore';
import { PageHead } from '../seo/PageHead';

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
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  if (!roomId)
    return (
      <>
        <PageHead
          title={t('seo.notFound.title')}
          description={t('seo.notFound.description')}
          noIndex
        />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            gap: 2,
          }}
        >
          <Typography variant="h4" component="h1" fontWeight={700}>
            {t('notFound.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('notFound.message')}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            {t('common.back')}
          </Button>
        </Box>
      </>
    );
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
