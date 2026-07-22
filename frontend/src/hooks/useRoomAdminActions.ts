import { useCallback, useState } from 'react';
import { getErrorMessage } from './getErrorMessage';

export interface RoomAdminHub<TRoom> {
  makeAdmin: (participantId: string) => Promise<TRoom>;
  removeAdmin: (participantId: string) => Promise<TRoom>;
  removeParticipant: (participantId: string) => Promise<TRoom>;
  updateRoomPassword?: (password?: string) => Promise<TRoom>;
}

export interface UseRoomAdminActionsParams<TRoom> {
  hub: RoomAdminHub<TRoom>;
  setRoom: (room: TRoom) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  errorKeyPrefix: string;
  setActionError?: (error: string | null) => void;
  setSnackbarError?: (error: string | null) => void;
  clearErrors?: () => void;
}

const noop = () => {};

function useAdminHandler<TRoom>(
  hubFn: (participantId: string) => Promise<TRoom>,
  setPending: (id: string | null) => void,
  errorKey: string,
  clearErrors: () => void,
  setSnackbarError: (e: string | null) => void,
  setRoom: (room: TRoom) => void,
  t: (key: string, options?: Record<string, unknown>) => string,
  errorKeyPrefix: string,
) {
  return useCallback(
    async (participantId: string) => {
      clearErrors();
      setPending(participantId);
      try {
        const result = await hubFn(participantId);
        setRoom(result);
      } catch (err) {
        setSnackbarError(t(`${errorKeyPrefix}.${errorKey}`, { message: getErrorMessage(err, t) }));
      } finally {
        setPending(null);
      }
    },
    [hubFn, setPending, clearErrors, setSnackbarError, setRoom, t, errorKeyPrefix, errorKey],
  );
}

export function useRoomAdminActions<TRoom>(params: UseRoomAdminActionsParams<TRoom>) {
  const { hub, setRoom, t, errorKeyPrefix } = params;
  const setActionError = params.setActionError ?? noop;
  const setSnackbarError = params.setSnackbarError ?? noop;
  const clearErrors = params.clearErrors ?? noop;

  const [pendingMakeAdminId, setPendingMakeAdminId] = useState<string | null>(null);
  const [pendingRemoveAdminId, setPendingRemoveAdminId] = useState<string | null>(null);
  const [pendingRemoveParticipantId, setPendingRemoveParticipantId] = useState<string | null>(null);

  const handleUpdatePassword = useCallback(
    async (password: string | null) => {
      if (!hub.updateRoomPassword) return;
      clearErrors();
      try {
        const result = await hub.updateRoomPassword(password ?? undefined);
        setRoom(result);
      } catch (err) {
        setActionError(t(`${errorKeyPrefix}.updatePassword`, { message: getErrorMessage(err, t) }));
        throw err;
      }
    },
    [hub, setRoom, clearErrors, setActionError, t, errorKeyPrefix],
  );

  const handleMakeAdmin = useAdminHandler(
    (id) => hub.makeAdmin(id),
    setPendingMakeAdminId,
    'makeAdmin',
    clearErrors,
    setSnackbarError,
    setRoom,
    t,
    errorKeyPrefix,
  );

  const handleRemoveAdmin = useAdminHandler(
    (id) => hub.removeAdmin(id),
    setPendingRemoveAdminId,
    'removeAdmin',
    clearErrors,
    setSnackbarError,
    setRoom,
    t,
    errorKeyPrefix,
  );

  const handleRemoveParticipant = useAdminHandler(
    (id) => hub.removeParticipant(id),
    setPendingRemoveParticipantId,
    'removeParticipant',
    clearErrors,
    setSnackbarError,
    setRoom,
    t,
    errorKeyPrefix,
  );

  return {
    handleUpdatePassword,
    handleMakeAdmin,
    handleRemoveAdmin,
    handleRemoveParticipant,
    pendingMakeAdminId,
    pendingRemoveAdminId,
    pendingRemoveParticipantId,
    setPendingMakeAdminId,
    setPendingRemoveAdminId,
    setPendingRemoveParticipantId,
  };
}
