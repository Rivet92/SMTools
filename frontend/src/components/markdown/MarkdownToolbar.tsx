import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { IconBold, IconItalic, IconUnderline, IconList, IconLink } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { SaveStatus } from './types';

interface MarkdownToolbarProps {
  onInsertFormat: (before: string, after: string, defaultText?: string) => void;
  saveStatus?: SaveStatus;
}

export function MarkdownToolbar({ onInsertFormat, saveStatus }: MarkdownToolbarProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.25,
        px: 0.5,
        py: 0.5,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
      }}
    >
      <Tooltip title={t('notes.bold')}>
        <IconButton
          size="small"
          aria-label={t('notes.bold')}
          onMouseDown={(e) => {
            e.preventDefault();
            onInsertFormat('**', '**', 'text');
          }}
        >
          <IconBold size={16} />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('notes.italic')}>
        <IconButton
          size="small"
          aria-label={t('notes.italic')}
          onMouseDown={(e) => {
            e.preventDefault();
            onInsertFormat('*', '*', 'text');
          }}
        >
          <IconItalic size={16} />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('notes.underline')}>
        <IconButton
          size="small"
          aria-label={t('notes.underline')}
          onMouseDown={(e) => {
            e.preventDefault();
            onInsertFormat('__', '__', 'text');
          }}
        >
          <IconUnderline size={16} />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('notes.list')}>
        <IconButton
          size="small"
          aria-label={t('notes.list')}
          onMouseDown={(e) => {
            e.preventDefault();
            onInsertFormat('- ', '', 'item');
          }}
        >
          <IconList size={16} />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('notes.link')}>
        <IconButton
          size="small"
          aria-label={t('notes.link')}
          onMouseDown={(e) => {
            e.preventDefault();
            onInsertFormat('[', '](url)', 'text');
          }}
        >
          <IconLink size={16} />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('notes.heading1')}>
        <IconButton
          size="small"
          aria-label={t('notes.heading1')}
          onMouseDown={(e) => {
            e.preventDefault();
            onInsertFormat('# ', '', t('notes.heading1'));
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1 }}>H1</Typography>
        </IconButton>
      </Tooltip>
      <Tooltip title={t('notes.heading2')}>
        <IconButton
          size="small"
          aria-label={t('notes.heading2')}
          onMouseDown={(e) => {
            e.preventDefault();
            onInsertFormat('## ', '', t('notes.heading2'));
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: 13, lineHeight: 1 }}>H2</Typography>
        </IconButton>
      </Tooltip>
      <Tooltip title={t('notes.heading3')}>
        <IconButton
          size="small"
          aria-label={t('notes.heading3')}
          onMouseDown={(e) => {
            e.preventDefault();
            onInsertFormat('### ', '', t('notes.heading3'));
          }}
        >
          <Typography sx={{ fontWeight: 500, fontSize: 12, lineHeight: 1 }}>H3</Typography>
        </IconButton>
      </Tooltip>
      <Box sx={{ flex: 1 }} />
      {saveStatus !== undefined && saveStatus !== 'idle' && (
        <Typography
          variant="caption"
          color={saveStatus === 'error' ? 'error' : 'text.secondary'}
          sx={{ whiteSpace: 'nowrap', alignSelf: 'center', mr: 0.5 }}
        >
          {t(`notes.saveStatus.${saveStatus}`)}
        </Typography>
      )}
    </Box>
  );
}
