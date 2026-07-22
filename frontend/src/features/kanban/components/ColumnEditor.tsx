import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MarkdownEditor, MarkdownPreview } from '../../../components/markdown';
import type { SaveStatus } from '../../../components/markdown/types';
import { useDebounce } from '../../../hooks/useDebounce';
import type { Column } from '../store/kanbanStore';

export function ColumnEditor({
  column,
  editing,
  onSave,
}: {
  column: Column;
  editing: boolean;
  onSave: (title: string, description: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(column.title);
  const [description, setDescription] = useState(column.description ?? '');
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const columnRef = useRef(column);

  useEffect(() => {
    if (column.id !== columnRef.current?.id) {
      setTitle(column.title);
      setDescription(column.description ?? '');
      setDirty(false);
      setSaveStatus('idle');
      columnRef.current = column;
    }
  }, [column]);

  const save = useCallback(async () => {
    if (!dirty) return;
    setSaveStatus('saving');
    try {
      await onSave(title, description);
      setDirty(false);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [dirty, title, description, onSave]);

  const { debouncedCallback: scheduleSave, cancel: cancelSave } = useDebounce(save, 600);

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      setDirty(true);
      setSaveStatus('idle');
      scheduleSave();
    },
    [scheduleSave],
  );

  const handleDescriptionChange = useCallback(
    (value: string) => {
      setDescription(value);
      setDirty(true);
      setSaveStatus('idle');
      scheduleSave();
    },
    [scheduleSave],
  );

  const handleBlur = useCallback(() => {
    cancelSave();
    save();
  }, [cancelSave, save]);

  return (
    <Stack spacing={2}>
      <TextField
        autoFocus
        label={t('kanban.columnTitleLabel')}
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            cancelSave();
            save();
          }
        }}
        size="small"
        fullWidth
      />

      {editing ? (
        <MarkdownEditor
          value={description}
          onChange={handleDescriptionChange}
          placeholder={t('kanban.columnDescriptionLabel')}
          minRows={5}
          editing
          saveStatus={saveStatus}
          autoFocus={false}
        />
      ) : (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            '& > *:first-child': { mt: 0 },
          }}
        >
          {description.trim() ? (
            <MarkdownPreview content={description} />
          ) : (
            <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {t('kanban.noDescription')}
            </Typography>
          )}
        </Box>
      )}
    </Stack>
  );
}
