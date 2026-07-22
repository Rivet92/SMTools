import { useState, useCallback } from 'react';

export function usePlanningPokerRoomDialogs() {
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const handleAddVoteItem = useCallback(() => {
    setShowAddItemDialog(true);
  }, []);

  const handleCloseAddItemDialog = useCallback(() => {
    setShowAddItemDialog(false);
  }, []);

  const handleManagePassword = useCallback(() => {
    setPasswordDialogOpen(true);
  }, []);

  const handleClosePasswordDialog = useCallback(() => {
    setPasswordDialogOpen(false);
  }, []);

  return {
    showAddItemDialog,
    handleAddVoteItem,
    handleCloseAddItemDialog,
    passwordDialogOpen,
    handleManagePassword,
    handleClosePasswordDialog,
  };
}
