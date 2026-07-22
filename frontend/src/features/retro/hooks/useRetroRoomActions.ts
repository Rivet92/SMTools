import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as hub from '../retroHub';
import { useRetroStore } from '../store/retroStore';
import { makeRoomAction } from '../../../hooks/makeRoomAction';
import { useRoomAdminActions } from '../../../hooks/useRoomAdminActions';
import { useRetroCardActions } from './useRetroCardActions';
import { useRetroVoteActions } from './useRetroVoteActions';
import { useRetroPhaseActions } from './useRetroPhaseActions';
import { useRetroActionItems } from './useRetroActionItems';
import { useRetroRoomDialogs } from './useRetroRoomDialogs';
import { useCopyRoomLink } from '../../../hooks/useCopyRoomLink';
import type { RoomState } from '../store/retroStore';

export function useRetroRoomActions() {
  const { t } = useTranslation();
  const setRoom = useRetroStore((s) => s.setRoom);
  const room = useRetroStore((s) => s.room);

  const {
    actionError,
    setActionError,
    passwordDialogOpen,
    handleManagePassword,
    handleClosePasswordDialog,
    showAddCardDialog,
    addCardColumnId,
    newCardContent,
    setNewCardContent,
    handleAddCard,
    handleCloseAddCardDialog,
    setShowAddCardDialog,
    setAddCardColumnId,
    showAddActionItemDialog,
    newActionItemContent,
    setNewActionItemContent,
    newActionItemAssigneeId,
    setNewActionItemAssigneeId,
    handleOpenAddActionItem,
    handleCloseAddActionItemDialog,
    setShowAddActionItemDialog,
    cardToDelete,
    setCardToDelete,
    actionItemToDelete,
    setActionItemToDelete,
  } = useRetroRoomDialogs();

  const { copyLink } = useCopyRoomLink();
  const handleCopyLink = useCallback(() => {
    if (!room) return;
    copyLink(room.id, (id) => `/tools/retro/${id}`);
  }, [room, copyLink]);

  const { handleDeleteCard, handleCreateGroupFromCards, handleMoveCardToGroup } =
    useRetroCardActions(setActionError);

  const { handleAddVotePoint, handleRemoveVotePoint, remainingVotePoints, totalVotePoints } =
    useRetroVoteActions(setActionError);

  const { handleNextPhase, handlePreviousPhase } = useRetroPhaseActions(setActionError);

  const { handleDeleteActionItem, handleAssignActionItem } = useRetroActionItems(setActionError);

  const adminActions = useRoomAdminActions<RoomState>({
    hub: {
      makeAdmin: hub.makeAdmin,
      removeAdmin: hub.removeAdmin,
      removeParticipant: hub.removeParticipant,
      updateRoomPassword: hub.updateRoomPassword,
    },
    setRoom,
    t,
    errorKeyPrefix: 'retro.errors',
    setActionError,
    setSnackbarError: setActionError,
    clearErrors: () => setActionError(null),
  });

  const handleSubmitCard = useCallback(async () => {
    const content = newCardContent.trim();
    const columnId = addCardColumnId;
    if (!content || !columnId) return;
    await makeRoomAction(
      async () => {
        const result = await hub.addCard(columnId, content);
        setShowAddCardDialog(false);
        setNewCardContent('');
        setAddCardColumnId('');
        return result;
      },
      {
        t,
        errorKey: 'retro.errors.addCard',
        setRoom,
        setError: setActionError,
      },
    )();
  }, [
    newCardContent,
    addCardColumnId,
    setRoom,
    t,
    setActionError,
    setShowAddCardDialog,
    setNewCardContent,
    setAddCardColumnId,
  ]);

  const handleSubmitActionItem = useCallback(async () => {
    const content = newActionItemContent.trim();
    if (!content) return;
    await makeRoomAction(
      async () => {
        const result = await hub.addActionItem(content, newActionItemAssigneeId || undefined);
        setShowAddActionItemDialog(false);
        setNewActionItemContent('');
        setNewActionItemAssigneeId('');
        return result;
      },
      {
        t,
        errorKey: 'retro.errors.addActionItem',
        setRoom,
        setError: setActionError,
      },
    )();
  }, [
    newActionItemContent,
    newActionItemAssigneeId,
    setRoom,
    t,
    setActionError,
    setShowAddActionItemDialog,
    setNewActionItemContent,
    setNewActionItemAssigneeId,
  ]);

  return {
    actionError,
    setActionError,
    handleCopyLink,
    passwordDialogOpen,
    passwordError: actionError,
    handleManagePassword,
    handleUpdatePassword: adminActions.handleUpdatePassword,
    handleClosePasswordDialog,
    handleClearPasswordError: () => setActionError(null),
    showAddCardDialog,
    addCardColumnId,
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
    showAddActionItemDialog,
    newActionItemContent,
    setNewActionItemContent,
    newActionItemAssigneeId,
    setNewActionItemAssigneeId,
    handleOpenAddActionItem,
    handleCloseAddActionItemDialog,
    handleSubmitActionItem,
    handleDeleteActionItem,
    handleAssignActionItem,
    cardToDelete,
    setCardToDelete,
    actionItemToDelete,
    setActionItemToDelete,
    participantToMakeAdmin: adminActions.pendingMakeAdminId,
    setParticipantToMakeAdmin: adminActions.setPendingMakeAdminId,
    participantToRemoveAdmin: adminActions.pendingRemoveAdminId,
    setParticipantToRemoveAdmin: adminActions.setPendingRemoveAdminId,
    handleMakeAdmin: adminActions.handleMakeAdmin,
    handleRemoveAdmin: adminActions.handleRemoveAdmin,
  };
}
