import {
  Avatar,
  FormControl,
  IconButton,
  InputLabel,
  ListItemIcon,
  Menu,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { IconUser } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../../i18n/store/languageStore';
import { ThemeToggle } from '../../theme/components/ThemeToggle';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useLogout } from '../hooks/useLogout';

export function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user } = useCurrentUser();
  const logoutMutation = useLogout();
  const { currentLanguage, languages, setCurrentLanguage } = useLanguageStore();

  const open = Boolean(anchorEl);
  const avatarLetter = user?.avatarUrl ? undefined : (user?.name?.[0] ?? '?').toUpperCase();

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        size="small"
        sx={{ p: 0 }}
        aria-label={t('user.aria.menu')}
        aria-haspopup="menu"
        aria-controls={open ? 'user-menu' : undefined}
      >
        <Avatar src={user?.avatarUrl} alt={user?.name} sx={{ width: 32, height: 32 }}>
          {avatarLetter}
        </Avatar>
      </IconButton>
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1 } } }}
      >
        <MenuItem disabled sx={{ opacity: '1 !important' }}>
          <Typography variant="body2" noWrap maxWidth={220}>
            {user?.name}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            navigate('/tools/profile');
          }}
          sx={{ alignItems: 'center', py: 1 }}
        >
          <ListItemIcon>
            <IconUser size={18} />
          </ListItemIcon>
          {t('user.editProfile')}
        </MenuItem>
        <MenuItem
          disableRipple
          onClick={(event) => event.stopPropagation()}
          sx={{ alignItems: 'center', py: 1 }}
        >
          <FormControl size="small" sx={{ minWidth: 140, my: 0 }}>
            <InputLabel id="user-menu-language-label">{t('language.selector')}</InputLabel>
            <Select
              labelId="user-menu-language-label"
              value={currentLanguage}
              label={t('language.selector')}
              onChange={(event) => setCurrentLanguage(event.target.value)}
            >
              {languages.map((language) => (
                <MenuItem key={language.code} value={language.code}>
                  {t(language.name)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </MenuItem>
        <ThemeToggle menuItem sx={{ alignItems: 'center', py: 1 }} />
        <MenuItem
          onClick={() => {
            handleClose();
            logoutMutation.mutate();
            navigate('/');
          }}
          sx={{ alignItems: 'center', py: 1 }}
        >
          {t('user.logout')}
        </MenuItem>
      </Menu>
    </>
  );
}
