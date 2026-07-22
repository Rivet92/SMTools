import { useState } from 'react';
import { Button, Paper, Slide, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconCookie } from '@tabler/icons-react';

const COOKIE_CONSENT_KEY = 'cookie-consent';

function getInitialVisible() {
  if (typeof window === 'undefined') {
    return false;
  }
  return !localStorage.getItem(COOKIE_CONSENT_KEY);
}

export function CookieConsent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(getInitialVisible);

  const handleDismiss = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'dismissed');
    setVisible(false);
  };

  return (
    <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          right: 16,
          zIndex: 'tooltip',
          p: 2,
          borderRadius: 2,
          maxWidth: {
            xs: '100%',
            sm: 480,
          },
          mx: 'auto',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <IconCookie size={28} style={{ marginTop: 4 }} />
          <Stack spacing={1} flex={1}>
            <Typography variant="body2">{t('cookies.message')}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button size="small" onClick={handleDismiss} variant="contained">
                {t('common.close')}
              </Button>
              <Button
                size="small"
                variant="text"
                color="inherit"
                onClick={() => {
                  navigate('/legal');
                }}
              >
                {t('cookies.learnMore')}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Slide>
  );
}
