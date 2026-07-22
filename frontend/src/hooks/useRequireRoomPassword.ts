import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../api/client';
import { getErrorMessage } from './getErrorMessage';

export type JoinStatus = 'idle' | 'loading' | 'password' | 'notFound' | 'error';

export interface UseRequireRoomPasswordParams<TRoom> {
  roomId: string;
  joinRoom: (roomId: string, password?: string) => Promise<TRoom>;
  setRoom: (room: TRoom) => void;
  setStoreError: (error: string | null) => void;
  lobbyPath: string;
  errorKey: string;
}

function getErrorCode(err: unknown): string | undefined {
  if (err instanceof ApiError) return err.code;
  if (err instanceof Error) {
    const colonIdx = err.message.indexOf(':');
    if (colonIdx > 0) return err.message.slice(0, colonIdx);
  }
  return undefined;
}

export function useRequireRoomPassword<TRoom extends { id: string; ownParticipantId: string }>(
  params: UseRequireRoomPasswordParams<TRoom>,
) {
  const { roomId, joinRoom, setRoom, setStoreError, lobbyPath, errorKey } = params;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [joinStatus, setJoinStatus] = useState<JoinStatus>('idle');
  const [joinPassword, setJoinPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const joiningRef = useRef(false);

  useEffect(() => {
    if (joinStatus === 'password' || joinStatus === 'notFound') return;
    if (joiningRef.current) return;

    joiningRef.current = true;
    setJoinStatus('loading');
    setStoreError(null);
    setError(null);

    const attemptJoin = async () => {
      try {
        const result = await joinRoom(roomId);
        joiningRef.current = false;
        setRoom(result);
        setStoreError(null);
      } catch (err) {
        joiningRef.current = false;
        const code = getErrorCode(err);
        const status = err instanceof ApiError ? err.status : undefined;

        if (code === 'invalid_password' || status === 403) {
          setJoinStatus('password');
        } else if (code === 'room_not_found' || status === 404) {
          setJoinStatus('notFound');
        } else {
          setError(t(errorKey, { message: getErrorMessage(err, t) }));
          setJoinStatus('error');
        }
      }
    };

    attemptJoin();

    return () => {
      joiningRef.current = false;
    };
  }, [roomId, joinStatus, setRoom, setStoreError, t, joinRoom, errorKey]);

  const handlePasswordSubmit = useCallback(async () => {
    if (!joinPassword.trim() || isSubmittingPassword) return;
    setIsSubmittingPassword(true);
    setError(null);
    try {
      const result = await joinRoom(roomId, joinPassword.trim());
      setRoom(result);
      setJoinPassword('');
    } catch (err) {
      setError(t(errorKey, { message: getErrorMessage(err, t) }));
    } finally {
      setIsSubmittingPassword(false);
    }
  }, [roomId, joinPassword, setRoom, t, joinRoom, errorKey, isSubmittingPassword]);

  const handleCancel = useCallback(() => {
    navigate(lobbyPath, { replace: true });
  }, [navigate, lobbyPath]);

  const handleRetry = useCallback(() => {
    setJoinStatus('idle');
    setError(null);
  }, []);

  return {
    joinStatus,
    error,
    joinPassword,
    setJoinPassword,
    setError,
    isSubmittingPassword,
    handlePasswordSubmit,
    handleCancel,
    handleRetry,
  };
}
