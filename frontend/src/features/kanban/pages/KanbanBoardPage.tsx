import { useCallback, useState } from 'react';
import { Box, Alert, Stack, Typography } from '@mui/material';
import { IconSettings } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHead } from '../../../components/seo/PageHead';
import { useKanbanStore } from '../store/kanbanStore';
import { useKanbanRoomData } from '../hooks/useKanbanRoomData';
import { useKanbanRoomActions } from '../hooks/useKanbanRoomActions';
import { useCopyRoomLink } from '../../../hooks/useCopyRoomLink';
import { useSnackbarError } from '../../../hooks/useSnackbarError';
import { selectConnectedCount } from '../../../stores/roomSelectors';
import { RoomHeader } from '../components/RoomHeader';
import { KanbanBoard } from '../components/KanbanBoard';
import { RoomLoadingState } from '../../../components/room-lobby/RoomLoadingState';
import { PasswordSettingsDialog } from '../../../components/feedback/PasswordSettingsDialog';
import { useRoomClosedSnackbar } from '../../../hooks/useRoomClosedSnackbar';

export function KanbanBoardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();

  const {
    room,
    connectionState,
    storeError,
    setError,
    isOwner,
    isAdmin,
    columns,
    cardsByColumn,
    hasPassword,
  } = useKanbanRoomData();

  const roomClosedMessage = useKanbanStore((s) => s.roomClosedMessage);
  const setRoomClosedMessage = useKanbanStore((s) => s.setRoomClosedMessage);

  useRoomClosedSnackbar(roomClosedMessage, setRoomClosedMessage, '/tools/kanban');

  const {
    actionError,
    setActionError,
    snackbarError,
    setSnackbarError,
    clearErrors,
    pendingCardId,
    handleMoveCard,
    handleAssignCard,
    handleUpdatePassword,
  } = useKanbanRoomActions();

  const { copyLink } = useCopyRoomLink();
  const handleCopyLink = useCallback(() => {
    if (!room?.id) return;
    copyLink(room.id, (id) => `/tools/kanban/${id}`);
  }, [room?.id, copyLink]);

  useSnackbarError(snackbarError, () => setSnackbarError(null));

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const handleOpenAddCard = useCallback(
    (columnId: string) => {
      if (!roomId) return;
      navigate(`/tools/kanban/${roomId}/new?columnId=${columnId}`);
    },
    [navigate, roomId],
  );

  const handleOpenEditCard = useCallback(
    (card: { id: string }) => {
      if (!room) return;
      navigate(`/tools/kanban/${room.id}/${card.id}`);
    },
    [navigate, room],
  );

  const handleManagePassword = useCallback(() => {
    clearErrors();
    setPasswordDialogOpen(true);
  }, [clearErrors]);

  const handleClosePasswordDialog = useCallback(() => {
    setActionError(null);
    setPasswordDialogOpen(false);
  }, [setActionError]);

  const handleClearStoreError = useCallback(() => {
    setError(null);
  }, [setError]);

  const isReconnecting = connectionState === 'connecting';
  const isDisconnected = connectionState === 'disconnected';

  if (!room) {
    return (
      <RoomLoadingState
        seoTitleKey="seo.kanban.title"
        seoDescriptionKey="seo.kanban.description"
        connectingKey="kanban.connecting"
      />
    );
  }

  return (
    <>
      <PageHead
        title={`${room.title} · ${t('seo.kanban.title')}`}
        description={t('seo.kanban.description')}
      />
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <RoomHeader
          roomTitle={room.title}
          roomId={room.id}
          hasPassword={hasPassword}
          canManage={isOwner || isAdmin}
          totalParticipants={room.participants.length}
          connectedCount={selectConnectedCount(room)}
          onCopyLink={handleCopyLink}
          onManagePassword={handleManagePassword}
        />

        {storeError && (
          <Alert severity="error" sx={{ mt: 1 }} onClose={handleClearStoreError}>
            {storeError}
          </Alert>
        )}
        {isReconnecting && (
          <Alert severity="info" sx={{ mt: 1 }}>
            {t('kanban.reconnecting')}
          </Alert>
        )}
        {isDisconnected && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {t('kanban.disconnected')}
          </Alert>
        )}

        {columns.length === 0 ? (
          <Box
            sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}
          >
            <Stack alignItems="center" spacing={2}>
              <IconSettings size={48} stroke={1} />
              <Typography variant="h6" color="text.secondary">
                {t('kanban.noColumns')}
              </Typography>
            </Stack>
          </Box>
        ) : (
          <KanbanBoard
            columns={columns}
            cardsByColumn={cardsByColumn}
            participants={room.participants}
            ownParticipantId={room.ownParticipantId}
            canManage={isAdmin}
            onAddCard={handleOpenAddCard}
            onEditCard={handleOpenEditCard}
            onMoveCard={handleMoveCard}
            onAssignCard={handleAssignCard}
            pendingCardId={pendingCardId}
          />
        )}

        <PasswordSettingsDialog
          open={passwordDialogOpen}
          hasPassword={hasPassword}
          onClose={handleClosePasswordDialog}
          onSubmit={handleUpdatePassword}
          error={actionError}
          onClearError={() => setActionError(null)}
          keyPrefix="kanban"
        />
      </Box>
    </>
  );
}
