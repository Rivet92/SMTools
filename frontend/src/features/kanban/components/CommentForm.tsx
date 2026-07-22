import { Box, Button, TextField } from '@mui/material';
import { IconSend } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export function CommentForm({
  value,
  onChange,
  onAdd,
}: {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 'auto' }}>
      <TextField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('kanban.commentPlaceholder')}
        fullWidth
        multiline
        size="small"
        minRows={1}
        maxRows={4}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onAdd();
          }
        }}
      />
      <Button
        variant="contained"
        size="small"
        onClick={onAdd}
        disabled={!value.trim()}
        sx={{ minWidth: 40, height: 40, p: 0 }}
      >
        <IconSend size={18} />
      </Button>
    </Box>
  );
}
