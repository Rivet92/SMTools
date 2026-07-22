import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
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
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" pt={2}>
        <LanguageSelector compact />
        <ThemeToggle />
      </Stack>

      <Box flex={1} display="flex" justifyContent="center" alignItems="center">
        <Stack spacing={3} alignItems="center" width="100%" maxWidth={360} px={2}>
          <Typography
            variant="h4"
            component="h1"
            fontWeight={600}
            sx={{ fontFamily: '"Orbitron", sans-serif' }}
          >
            {t('app.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {t('auth.login.title')}
          </Typography>
          <LoginOptions returnUrl={returnUrl} />
        </Stack>
      </Box>
    </Box>
  );
}
