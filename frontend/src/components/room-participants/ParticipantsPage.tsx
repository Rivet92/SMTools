import { useCallback } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { selectIsAdmin, selectIsOwner } from '../../stores/roomSelectors';
import {
  ParticipantsManager,
  type ParticipantBase,
} from './ParticipantsManager';
import { useRoomAdminActions } from '../../hooks/useRoomAdminActions';

interface RoomData {
  id: string;
  ownParticipantId: string;
  participants: ParticipantBase[];
  version: number;
}

interface AdminHub {
  makeAdmin: (participantId: string) => Promise<unknown>;
  removeAdmin: (participantId: string) => Promise<unknown>;
  removeParticipant: (participantId: string) => Promise<unknown>;
}

export interface ParticipantsPageProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useStore: any;
  hub: AdminHub;
  navigateBack: string;
  errorKeyPrefix: string;
  featureKey: string;
  getVoteStatus?: (participantId: string) => boolean;
}

export function ParticipantsPage({
  useStore,
  hub,
  navigateBack,
  errorKeyPrefix,
  featureKey,
  getVoteStatus,
}: ParticipantsPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();

  const room = useStore((s: { room: RoomData | null }) => s.room) as RoomData | null;
  const setRoom = useStore((s: { setRoom: (room: RoomData) => void }) => s.setRoom) as (room: RoomData) => void;
  const isOwner = useStore((s: { room: RoomData | null }) => selectIsOwner(s.room));
  const isAdmin = useStore((s: { room: RoomData | null }) => selectIsAdmin(s.room));

  const adminActions = useRoomAdminActions<unknown>({
    hub,
    setRoom: setRoom as (room: unknown) => void,
    t,
    errorKeyPrefix,
  });

  const handleGoBack = useCallback(() => {
    navigate(navigateBack);
  }, [navigate, navigateBack]);

  if (!room || room.id !== roomId) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return <Navigate to={navigateBack} replace />;
  }

  return (
    <ParticipantsManager
      participants={room.participants as ParticipantBase[]}
      ownParticipantId={room.ownParticipantId}
      canManage={isAdmin}
      isOwner={isOwner}
      callbacks={{
        onMakeAdmin: adminActions.handleMakeAdmin,
        onRemoveAdmin: adminActions.handleRemoveAdmin,
        onRemoveParticipant: adminActions.handleRemoveParticipant,
        onGoBack: handleGoBack,
      }}
      pending={{
        makeAdminId: adminActions.pendingMakeAdminId,
        removeAdminId: adminActions.pendingRemoveAdminId,
        removeParticipantId: adminActions.pendingRemoveParticipantId,
      }}
      featureKey={featureKey}
      getVoteStatus={getVoteStatus}
    />
  );
}
