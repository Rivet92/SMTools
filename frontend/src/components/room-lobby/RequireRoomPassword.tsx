import { useCallback, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { GenericDialog } from '../GenericDialog';
import { NotFoundPage } from '../../features/error/pages/NotFoundPage';
import { PageHead } from '../../features/seo/components/PageHead';
import { useRequireRoomPassword } from '../../hooks/useRequireRoomPassword';

export function RequireRoomPassword<TRoom extends { id: string; ownParticipantId: string }>(props: {
  roomId: string;
  joinRoom: (roomId: string, password?: string) => Promise<TRoom>;
  setRoom: (room: TRoom) => void;
  setStoreError: (error: string | null) => void;
  lobbyPath: string;
  i18nPrefix: string;
  children?: React.ReactNode;
  getRoom?: () => TRoom | null;
}) {
  const { i18nPrefix, roomId, joinRoom, setRoom, setStoreError, lobbyPath, children, getRoom } =
    props;
  const { t } = useTranslation();

  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(() => {
    const currentRoom = getRoom?.();
    return currentRoom?.id === roomId ? currentRoom.id : null;
  });

  const hasJoined = joinedRoomId === roomId;

  const wrappedSetRoom = useCallback(
    (room: TRoom) => {
      setRoom(room);
      setJoinedRoomId(room.id);
    },
    [setRoom],
  );

  const i18n = useMemo(() => {
    const joinRoomKey =
      i18nPrefix === 'planningPoker' ? 'planningPoker.joinRoom' : 'common.joinRoom';
    return {
      seoTitle: `seo.${i18nPrefix}.title`,
      seoDescription: `seo.${i18nPrefix}.description`,
      connecting: `${i18nPrefix}.connecting`,
      passwordRequired: `${i18nPrefix}.passwordRequired`,
      passwordHint: `${i18nPrefix}.passwordRequiredHint`,
      passwordLabel: `${i18nPrefix}.passwordLabel`,
      joinRoom: joinRoomKey,
      cancel: `${i18nPrefix}.cancel`,
      errorKey: `${i18nPrefix}.errors.joinRoom`,
    };
  }, [i18nPrefix]);

  const hook = useRequireRoomPassword({
    roomId,
    joinRoom,
    setRoom: wrappedSetRoom,
    setStoreError,
    lobbyPath,
    errorKey: i18n.errorKey,
  });

  if (hasJoined && children) return <>{children}</>;

  if (hook.joinStatus === 'idle' || hook.joinStatus === 'loading') {
    return (
      <>
        <PageHead title={t(i18n.seoTitle)} description={t(i18n.seoDescription)} />
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
          <CircularProgress />
          <Typography color="text.secondary">{t(i18n.connecting)}</Typography>
        </Box>
      </>
    );
  }

  if (hook.joinStatus === 'notFound') {
    return <NotFoundPage />;
  }

  if (hook.joinStatus === 'password') {
    return (
      <>
        <PageHead title={t(i18n.seoTitle)} description={t(i18n.seoDescription)} />
        <GenericDialog
          open
          onClose={hook.handleCancel}
          title={t(i18n.passwordRequired)}
          actions={
            <>
              <Button onClick={hook.handleCancel} disabled={hook.isSubmittingPassword}>
                {t(i18n.cancel)}
              </Button>
              <Button
                variant="contained"
                onClick={hook.handlePasswordSubmit}
                disabled={!hook.joinPassword.trim() || hook.isSubmittingPassword}
              >
                {hook.isSubmittingPassword ? <CircularProgress size={20} /> : t(i18n.joinRoom)}
              </Button>
            </>
          }
        >
          <Stack spacing={2} sx={{ mt: 1 }}>
            {hook.error && (
              <Alert severity="error" onClose={() => hook.setError(null)}>
                {hook.error}
              </Alert>
            )}
            <Typography variant="body2" color="text.secondary">
              {t(i18n.passwordHint)}
            </Typography>
            <TextField
              autoFocus
              label={t(i18n.passwordLabel)}
              type="password"
              value={hook.joinPassword}
              onChange={(e) => hook.setJoinPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && hook.handlePasswordSubmit()}
              disabled={hook.isSubmittingPassword}
              fullWidth
            />
          </Stack>
        </GenericDialog>
      </>
    );
  }

  return (
    <>
      <PageHead title={t(i18n.seoTitle)} description={t(i18n.seoDescription)} />
      <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4, px: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => hook.setError(null)}>
          {hook.error || t(i18n.errorKey, { message: t('common.unknownError') })}
        </Alert>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={hook.handleRetry}>
            {t('common.retry')}
          </Button>
          <Button onClick={hook.handleCancel}>{t(i18n.cancel)}</Button>
        </Stack>
      </Box>
    </>
  );
}
