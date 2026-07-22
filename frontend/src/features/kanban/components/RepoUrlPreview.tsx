import { useCallback, useState } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, Link } from '@mui/material';
import {
  IconCopy,
  IconChevronDown,
  IconBrandVscode,
  IconBrandVisualStudio,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface RepoUrlPreviewProps {
  value: string;
}

export function RepoUrlPreview({ value }: RepoUrlPreviewProps) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const menuOpen = Boolean(anchorEl);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const input = document.createElement('input');
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
  }, [value]);

  const handleCloneInVscode = useCallback(() => {
    const vscodeUrl = `vscode://vscode.git/clone?url=${encodeURIComponent(value)}`;
    window.open(vscodeUrl, '_blank', 'noopener,noreferrer');
  }, [value]);

  const handleCloneInVisualStudio = useCallback(() => {
    const vsUrl = `visualstudio://clone?url=${encodeURIComponent(value)}`;
    window.open(vsUrl, '_blank', 'noopener,noreferrer');
  }, [value]);

  return (
    <Box sx={{ flex: 1, position: 'relative', borderRadius: 1 }}>
      <Box
        component="fieldset"
        sx={{
          position: 'absolute',
          top: -5,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 'inherit',
          border: '1px solid',
          borderColor: 'action.disabled',
          m: 0,
          p: 0,
          pointerEvents: 'none',
        }}
      >
        <legend
          style={{
            marginLeft: 8,
            padding: '0 4px',
            fontSize: '0.75rem',
            color: 'rgba(0, 0, 0, 0.38)',
            lineHeight: 1,
            maxWidth: '0.01px',
            whiteSpace: 'nowrap',
          }}
        >
          <Box
            component="span"
            sx={{ bgcolor: 'background.default', px: 0.5, color: 'text.disabled' }}
          >
            {t('kanban.repoUrlLabel')}
          </Box>
        </legend>
      </Box>
      <Box sx={{ display: 'flex', height: 40 }}>
        <Link
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          sx={{
            flex: 1,
            px: 1.75,
            fontSize: '1rem',
            lineHeight: '40px',
            color: 'primary.main',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Link>
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={<IconCopy size={16} />}
          onClick={handleCopy}
          sx={{
            borderRadius: 0,
            px: 1,
            whiteSpace: 'nowrap',
            height: '100%',
            borderRight: '2px solid',
            borderRightColor: 'primary.dark',
          }}
        >
          {t('kanban.copyUrl')}
        </Button>
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label={t('kanban.aria.cloneOptions')}
          aria-haspopup="menu"
          aria-controls={menuOpen ? 'clone-options-menu' : undefined}
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: '0 10px 10px 0',
            width: 32,
            height: '100%',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          <IconChevronDown size={16} />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          id="clone-options-menu"
          slotProps={{ paper: { sx: { py: 0.5, minWidth: 210 } } }}
        >
          <MenuItem
            dense
            onClick={() => {
              setAnchorEl(null);
              handleCloneInVscode();
            }}
          >
            <IconBrandVscode size={16} style={{ marginRight: 8 }} />
            {t('kanban.cloneInVscode')}
          </MenuItem>
          <MenuItem
            dense
            onClick={() => {
              setAnchorEl(null);
              handleCloneInVisualStudio();
            }}
          >
            <IconBrandVisualStudio size={16} style={{ marginRight: 8 }} />
            {t('kanban.cloneInVisualStudio')}
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
