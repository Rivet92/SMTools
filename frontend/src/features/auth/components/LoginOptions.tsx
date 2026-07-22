import { Button, Stack } from '@mui/material';
import { IconBrandGithub } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { startOAuthLogin } from '../api';

interface LoginOptionsProps {
  returnUrl?: string;
}

export function LoginOptions({ returnUrl = '/' }: LoginOptionsProps) {
  const { t } = useTranslation();

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    startOAuthLogin(provider, returnUrl);
  };

  return (
    <Stack spacing={3} alignItems="center" width="100%" maxWidth={360}>
      <Stack spacing={2} width="100%">
        <Button
          variant="outlined"
          startIcon={<img src="/google-social-icon.svg" alt="" width={20} height={20} />}
          onClick={() => handleOAuthLogin('google')}
        >
          {t('home.login.google')}
        </Button>
        <Button
          variant="outlined"
          startIcon={<IconBrandGithub size={20} />}
          onClick={() => handleOAuthLogin('github')}
        >
          {t('home.login.github')}
        </Button>
      </Stack>
    </Stack>
  );
}
