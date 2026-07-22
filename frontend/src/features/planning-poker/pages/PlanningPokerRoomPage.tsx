import { useCallback, useState } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usePlanningPokerStore } from '../store/planningPokerStore';
import { PageHead } from '../../seo/components/PageHead';
import { usePlanningPokerRoomData } from '../hooks/usePlanningPokerRoomData';
import { usePlanningPokerRoomActions } from '../hooks/usePlanningPokerRoomActions';
import { usePlanningPokerRoomDialogs } from '../hooks/usePlanningPokerRoomDialogs';
import { useCopyRoomLink } from '../../../hooks/useCopyRoomLink';
import { useSnackbarError } from '../../../hooks/useSnackbarError';
import { AddVoteItemDialog } from '../components/AddVoteItemDialog';
import { RoomHeader } from '../components/RoomHeader';
import { RoomContent } from '../components/RoomContent';
import { PasswordSettingsDialog } from '../../../components/feedback/PasswordSettingsDialog';
import { RoomLoadingState } from '../../../components/room-lobby/RoomLoadingState';
import { useRoomClosedSnackbar } from '../../../hooks/useRoomClosedSnackbar';

export function PlanningPokerRoomPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    room,
    connectionState,
    storeError,
    setError,
    isOwner,
    isAdmin,
    connectedCount,
    selectedVoteItemId,
    setSelectedVoteItemId,
    selectedVoteItem,
    cards,
    hasPassword,
  } = usePlanningPokerRoomData();

  const [showParticipants, setShowParticipants] = useState(true);
  const [showVoteItems, setShowVoteItems] = useState(true);

  const roomClosedMessage = usePlanningPokerStore((s) => s.roomClosedMessage);
  const setRoomClosedMessage = usePlanningPokerStore((s) => s.setRoomClosedMessage);

  useRoomClosedSnackbar(roomClosedMessage, setRoomClosedMessage, '/tools/planning-poker');

  const {
    actionError,
    setActionError,
    snackbarError,
    setSnackbarError,
    isVoting,
    isRevealing,
    isHiding,
    isResetting,
    pendingFocusItemId,
    pendingDeleteItemId,
    handleVote,
    handleReveal,
    handleHide,
    handleReset,
    handleAddVoteItemSubmit,
    handleFocusVoteItem,
    handleDeleteVoteItem,
    handleUpdatePassword,
  } = usePlanningPokerRoomActions(selectedVoteItem);

  const {
    showAddItemDialog,
    handleAddVoteItem,
    handleCloseAddItemDialog,
    passwordDialogOpen,
    handleManagePassword,
    handleClosePasswordDialog,
  } = usePlanningPokerRoomDialogs();

  const { copyLink } = useCopyRoomLink();
  const handleCopyLink = useCallback(() => {
    if (!room?.id) return;
    copyLink(room.id, (id) => `/tools/planning-poker/${id}`);
  }, [room?.id, copyLink]);

  useSnackbarError(snackbarError, () => setSnackbarError(null));

  const handleViewResults = useCallback(() => {
    if (!room) return;
    navigate(`/tools/planning-poker/${room.id}/results`);
  }, [navigate, room]);

  const handleOpenParticipants = useCallback(() => {
    if (!room) return;
    navigate(`/tools/planning-poker/${room.id}/participants`);
  }, [navigate, room]);

  const handleToggleParticipants = useCallback(() => setShowParticipants((prev) => !prev), []);
  const handleToggleVoteItems = useCallback(() => setShowVoteItems((prev) => !prev), []);

  const handleCloseAddItem = useCallback(() => {
    setActionError(null);
    handleCloseAddItemDialog();
  }, [setActionError, handleCloseAddItemDialog]);

  const handleClosePassword = useCallback(() => {
    setActionError(null);
    handleClosePasswordDialog();
  }, [setActionError, handleClosePasswordDialog]);

  const handleClearActionError = useCallback(() => setActionError(null), [setActionError]);
  const handleClearStoreError = useCallback(() => setError(null), [setError]);

  if (!room) {
    return <RoomLoadingState seoTitleKey="seo.planningPoker.title" seoDescriptionKey="seo.planningPoker.description" connectingKey="planningPoker.connecting" />;
  }

  return (
    <>
      <PageHead
        title={`${room.title} · ${t('seo.planningPoker.title')}`}
        description={t('seo.planningPoker.description')}
      />
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <RoomHeader
          roomTitle={room.title}
          hasPassword={hasPassword}
          canManage={isOwner || isAdmin}
          totalParticipants={room.participants.length}
          connectedCount={connectedCount}
          onCopyLink={handleCopyLink}
          onManagePassword={handleManagePassword}
          onViewResults={handleViewResults}
          onOpenParticipants={handleOpenParticipants}
          showParticipants={showParticipants}
          onToggleParticipants={handleToggleParticipants}
          showVoteItems={showVoteItems}
          onToggleVoteItems={handleToggleVoteItems}
        />

        <RoomContent
          room={room}
          connectionState={connectionState}
          selectedVoteItemId={selectedVoteItemId}
          showVoteItems={showVoteItems}
          showParticipants={showParticipants}
          storeError={storeError}
          onClearStoreError={handleClearStoreError}
          onSelectItem={setSelectedVoteItemId}
          onAddItem={handleAddVoteItem}
          onFocusItem={handleFocusVoteItem}
          onDeleteItem={handleDeleteVoteItem}
          isOwner={isOwner}
          isAdmin={isAdmin}
          selectedVoteItem={selectedVoteItem}
          cards={cards}
          onVote={handleVote}
          onReveal={handleReveal}
          onHide={handleHide}
          onReset={handleReset}
          isVoting={isVoting}
          isRevealing={isRevealing}
          isHiding={isHiding}
          isResetting={isResetting}
          pendingFocusItemId={pendingFocusItemId}
          pendingDeleteItemId={pendingDeleteItemId}
          ownParticipantId={room.ownParticipantId}
        />

        <AddVoteItemDialog
          open={showAddItemDialog}
          onClose={handleCloseAddItem}
          onSubmit={handleAddVoteItemSubmit}
          error={actionError}
          onClearError={handleClearActionError}
        />
        <PasswordSettingsDialog
          open={passwordDialogOpen}
          hasPassword={hasPassword}
          onClose={handleClosePassword}
          onSubmit={handleUpdatePassword}
          error={actionError}
          onClearError={handleClearActionError}
          keyPrefix="planningPoker"
        />
      </Box>
    </>
  );
}
