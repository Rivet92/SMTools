import { Box, Alert, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoomClosedSnackbar } from '../../../hooks/useRoomClosedSnackbar';
import { PageHead } from '../../seo/components/PageHead';
import { useRetroStore } from '../store/retroStore';
import { useRetroRoomData } from '../hooks/useRetroRoomData';
import { useRetroRoomActions } from '../hooks/useRetroRoomActions';
import { RoomHeader } from '../components/RoomHeader';
import { RetroBoard } from '../components/RetroBoard';
import { CardsSummaryTable } from '../components/CardsSummaryTable';
import { InlineActionItemForm } from '../components/InlineActionItemForm';
import { AddCardDialog } from '../components/AddCardDialog';
import { PasswordSettingsDialog } from '../../../components/feedback/PasswordSettingsDialog';
import { RetroPhase } from '../../../types/models/retro';

export function RetroRoomPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const roomClosedMessage = useRetroStore((s) => s.roomClosedMessage);
  const setRoomClosedMessage = useRetroStore((s) => s.setRoomClosedMessage);

  useRoomClosedSnackbar(roomClosedMessage, setRoomClosedMessage, '/tools/retro');

  const {
    room,
    storeError,
    setError,
    canManage,
    connectedCount,
    template,
    hasPassword,
    phaseName,
  } = useRetroRoomData();

  const {
    actionError,
    setActionError,
    handleCopyLink,
    passwordDialogOpen,
    passwordError,
    handleManagePassword,
    handleUpdatePassword,
    handleClosePasswordDialog,
    handleClearPasswordError,
    showAddCardDialog,
    newCardContent,
    setNewCardContent,
    handleAddCard,
    handleCloseAddCardDialog,
    handleSubmitCard,
    handleDeleteCard,
    handleAddVotePoint,
    handleRemoveVotePoint,
    remainingVotePoints,
    totalVotePoints,
    handleMoveCardToGroup,
    handleCreateGroupFromCards,
    handleNextPhase,
    handlePreviousPhase,
    newActionItemContent,
    setNewActionItemContent,
    newActionItemAssigneeId,
    setNewActionItemAssigneeId,
    handleSubmitActionItem,
    handleDeleteActionItem,
    handleAssignActionItem,
  } = useRetroRoomActions();

  if (!room || !template) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageHead
        title={`${room.title} · ${t('seo.retro.title')}`}
        description={t('seo.retro.description')}
      />
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <RoomHeader
          roomTitle={room.title}
          phase={room.phase}
          phaseName={phaseName}
          hasPassword={room.hasPassword}
          canManage={canManage}
          connectedCount={connectedCount}
          totalParticipants={room.participants.length}
          onCopyLink={handleCopyLink}
          onNextPhase={handleNextPhase}
          onPreviousPhase={handlePreviousPhase}
          onOpenParticipants={() => navigate(`/tools/retro/${roomId}/participants`)}
          onChangePassword={canManage ? handleManagePassword : undefined}
          remainingVotePoints={room.phase === RetroPhase.Voting ? remainingVotePoints : undefined}
          totalVotePoints={room.phase === RetroPhase.Voting ? totalVotePoints : undefined}
        />

        {storeError && (
          <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
            {storeError}
          </Alert>
        )}
        {actionError && (
          <Alert severity="error" sx={{ mt: 1 }} onClose={() => setActionError(null)}>
            {actionError}
          </Alert>
        )}

        {room.phase === RetroPhase.Actions ? (
          <Box sx={{ flex: 1, display: 'flex', gap: 2, p: 1, overflow: 'auto', minHeight: 0 }}>
            <Box sx={{ flex: '1 1 50%', minWidth: 0, overflow: 'auto' }}>
              <CardsSummaryTable
                templateKey={template.key}
                columns={room.columns}
                cards={room.cards}
                groups={room.groups}
              />
            </Box>
            <Box sx={{ width: 380, flexShrink: 0 }}>
              <InlineActionItemForm
                actionItems={room.actionItems}
                participants={room.participants}
                isAdmin={canManage}
                content={newActionItemContent}
                onContentChange={setNewActionItemContent}
                assigneeId={newActionItemAssigneeId}
                onAssigneeChange={setNewActionItemAssigneeId}
                onSubmit={handleSubmitActionItem}
                onDelete={handleDeleteActionItem}
                onAssign={handleAssignActionItem}
                error={actionError}
                onClearError={() => setActionError(null)}
              />
            </Box>
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', overflow: 'auto', minHeight: 0 }}>
            <RetroBoard
              templateKey={template.key}
              columns={room.columns}
              cards={room.cards}
              groups={room.groups}
              participants={room.participants}
              phase={room.phase}
              ownParticipantId={room.ownParticipantId}
              isAdmin={canManage}
              onAddCard={handleAddCard}
              onDeleteCard={handleDeleteCard}
              onAddVotePoint={handleAddVotePoint}
              onRemoveVotePoint={handleRemoveVotePoint}
              onMoveCardToGroup={handleMoveCardToGroup}
              onCreateGroupFromCards={handleCreateGroupFromCards}
              canAddVote={remainingVotePoints > 0}
            />
          </Box>
        )}

        <PasswordSettingsDialog
          open={passwordDialogOpen}
          hasPassword={hasPassword}
          onClose={handleClosePasswordDialog}
          onSubmit={handleUpdatePassword}
          error={passwordError}
          onClearError={handleClearPasswordError}
          keyPrefix="retro"
        />

        <AddCardDialog
          open={showAddCardDialog}
          onClose={handleCloseAddCardDialog}
          content={newCardContent}
          onContentChange={setNewCardContent}
          onSubmit={handleSubmitCard}
          error={actionError}
          onClearError={() => setActionError(null)}
        />

      </Box>
    </>
  );
}
