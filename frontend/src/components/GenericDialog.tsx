import type { ReactNode } from 'react';
import type { DialogProps } from '@mui/material';
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { IconX } from '@tabler/icons-react';

interface GenericDialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  maxWidth?: DialogProps['maxWidth'];
  fullWidth?: boolean;
  titleId?: string;
  TransitionProps?: DialogProps['TransitionProps'];
}

export function GenericDialog({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'xs',
  fullWidth = true,
  titleId,
  TransitionProps,
}: GenericDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      aria-labelledby={titleId}
      TransitionProps={TransitionProps}
    >
      <DialogTitle
        id={titleId}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}
      >
        {title}
        <IconButton size="small" onClick={onClose} aria-label="close">
          <IconX size={18} />
        </IconButton>
      </DialogTitle>
      {children && <DialogContent sx={{ p: 2 }}>{children}</DialogContent>}
      {actions && <DialogActions sx={{ p: 2 }}>{actions}</DialogActions>}
    </Dialog>
  );
}
