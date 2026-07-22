import { Button, DialogContentText } from '@mui/material';
import { GenericDialog } from '../GenericDialog';
import type { UseMutationResult } from '@tanstack/react-query';

interface DeleteRoomDialogProps {
  open: boolean;
  onClose: () => void;
  isOwner: boolean;
  deleteForMe: UseMutationResult<unknown, Error, string>;
  deleteForEveryone: UseMutationResult<unknown, Error, string>;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  labels: {
    title: string;
    confirmText: string;
    cancel: string;
    deleteForMe: string;
    deleteForEveryone: string;
    delete: string;
  };
}

export function DeleteRoomDialog({
  open,
  onClose,
  isOwner,
  deleteForMe,
  deleteForEveryone,
  onDeleteForMe,
  onDeleteForEveryone,
  labels,
}: DeleteRoomDialogProps) {
  return (
    <GenericDialog
      open={open}
      onClose={onClose}
      title={labels.title}
      actions={
        <>
          <Button onClick={onClose}>{labels.cancel}</Button>
          {isOwner ? (
            <>
              <Button
                color="error"
                variant="outlined"
                disabled={deleteForMe.isPending}
                onClick={onDeleteForMe}
              >
                {labels.deleteForMe}
              </Button>
              <Button
                color="error"
                variant="contained"
                disabled={deleteForEveryone.isPending}
                onClick={onDeleteForEveryone}
              >
                {labels.deleteForEveryone}
              </Button>
            </>
          ) : (
            <Button
              color="error"
              variant="contained"
              disabled={deleteForMe.isPending}
              onClick={onDeleteForMe}
            >
              {labels.delete}
            </Button>
          )}
        </>
      }
    >
      <DialogContentText>{labels.confirmText}</DialogContentText>
    </GenericDialog>
  );
}
