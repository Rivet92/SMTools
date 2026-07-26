import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { LanguageSelector } from '../../i18n/components/LanguageSelector';
import { ThemeToggle } from '../../theme/components/ThemeToggle';
import { LoginOptions } from '../components/LoginOptions';

export function LoginPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const returnUrl = (location.state as { returnUrl?: string } | null)?.returnUrl ?? '/';

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (theme) => theme.zIndex.modal,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'center', pt: 2 }}
      >
        <LanguageSelector compact />
        <ThemeToggle />
      </Stack>

      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Stack spacing={3} sx={{ alignItems: 'center', width: '100%', maxWidth: 360, px: 2 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 600 }}
          >
            {t('app.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
            {t('auth.login.title')}
          </Typography>
          <LoginOptions returnUrl={returnUrl} />
        </Stack>
      </Box>
    </Box>
  );
}
