import { useState, useCallback } from 'react';

export function useRetroRoomDialogs() {
  const [actionError, setActionError] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [addCardColumnId, setAddCardColumnId] = useState<string | ''>('');
  const [newCardContent, setNewCardContent] = useState('');

  const [showAddActionItemDialog, setShowAddActionItemDialog] = useState(false);
  const [newActionItemContent, setNewActionItemContent] = useState('');
  const [newActionItemAssigneeId, setNewActionItemAssigneeId] = useState<string | ''>('');

  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [actionItemToDelete, setActionItemToDelete] = useState<string | null>(null);

  const handleAddCard = useCallback((columnId: string) => {
    setAddCardColumnId(columnId);
    setNewCardContent('');
    setActionError(null);
    setShowAddCardDialog(true);
  }, []);

  const handleCloseAddCardDialog = useCallback(() => {
    setShowAddCardDialog(false);
    setNewCardContent('');
    setAddCardColumnId('');
    setActionError(null);
  }, []);

  const handleOpenAddActionItem = useCallback(() => {
    setNewActionItemContent('');
    setNewActionItemAssigneeId('');
    setActionError(null);
    setShowAddActionItemDialog(true);
  }, []);

  const handleCloseAddActionItemDialog = useCallback(() => {
    setShowAddActionItemDialog(false);
    setNewActionItemContent('');
    setNewActionItemAssigneeId('');
    setActionError(null);
  }, []);

  const handleManagePassword = useCallback(() => {
    setActionError(null);
    setPasswordDialogOpen(true);
  }, []);

  const handleClosePasswordDialog = useCallback(() => {
    setPasswordDialogOpen(false);
  }, []);

  return {
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
  };
}
