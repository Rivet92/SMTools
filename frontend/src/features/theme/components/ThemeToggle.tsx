import { IconButton, MenuItem, Stack, Tooltip, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { IconMoon, IconSun } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../store/themeStore';

interface ThemeToggleProps {
  showLabel?: boolean;
  menuItem?: boolean;
  sx?: SxProps<Theme>;
}

export function ThemeToggle({ showLabel = true, menuItem = false, sx }: ThemeToggleProps) {
  const { t } = useTranslation();
  const { mode, toggleMode } = useThemeStore();

  const isLight = mode === 'light';
  const label = isLight ? t('theme.darkMode') : t('theme.lightMode');

  const content = (
    <Stack direction="row" spacing={1} alignItems="center">
      {isLight ? <IconMoon size={20} /> : <IconSun size={20} />}
      {showLabel && (
        <Typography variant="body2" component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          {label}
        </Typography>
      )}
    </Stack>
  );

  if (menuItem) {
    return (
      <MenuItem onClick={toggleMode} sx={sx}>
        {content}
      </MenuItem>
    );
  }

  return (
    <Tooltip title={showLabel ? label : ''}>
      <IconButton
        onClick={toggleMode}
        size="small"
        color="inherit"
        aria-label={t('theme.aria.toggle')}
        sx={{
          borderRadius: 2,
          px: 1.5,
          py: 0.75,
        }}
      >
        {content}
      </IconButton>
    </Tooltip>
  );
}
