import { Box, IconButton, TextField, Tooltip } from '@mui/material';
import { IconArchive, IconArchiveOff, IconEdit, IconEye, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export interface NoteEditorToolbarProps {
  title: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isArchived: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
  isUpdatePending: boolean;
  isRemovePending: boolean;
  autoFocusTitle?: boolean;
  onTitleKeyDown?: (e: React.KeyboardEvent) => void;
}

export function NoteEditorToolbar({
  title,
  onTitleChange,
  isArchived,
  isEditing,
  onToggleEdit,
  onToggleArchive,
  onDelete,
  isUpdatePending,
  isRemovePending,
  autoFocusTitle,
  onTitleKeyDown,
}: NoteEditorToolbarProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pt: 1.25, pb: 1 }}>
      <TextField
        fullWidth
        size="small"
        value={title}
        onChange={onTitleChange}
        onKeyDown={onTitleKeyDown}
        placeholder={t('notes.titlePlaceholder')}
        variant="standard"
        autoFocus={autoFocusTitle}
        slotProps={{
          input: {
            disableUnderline: true,
            sx: { fontWeight: 600, fontSize: '1.1rem' },
          },
        }}
      />
      <Tooltip title={t(isEditing ? 'notes.preview' : 'notes.edit')}>
        <IconButton onClick={onToggleEdit} aria-label={t('notes.aria.edit')}>
          {isEditing ? <IconEye size={20} /> : <IconEdit size={20} />}
        </IconButton>
      </Tooltip>
      <Tooltip title={t(isArchived ? 'notes.unarchive' : 'notes.archive')}>
        <IconButton
          onClick={onToggleArchive}
          disabled={isUpdatePending}
          aria-label={t('notes.aria.archive')}
        >
          {isArchived ? <IconArchiveOff size={20} /> : <IconArchive size={20} />}
        </IconButton>
      </Tooltip>
      <Tooltip title={t('notes.delete')}>
        <IconButton
          onClick={onDelete}
          disabled={isRemovePending}
          color="error"
          aria-label={t('notes.aria.delete')}
        >
          <IconTrash size={20} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
