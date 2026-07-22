import { Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../components/seo/PageHead';
import { LandingFooter } from '../components/LandingFooter';

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <PageHead title={t('seo.home.title')} description={t('seo.home.description')} />
      <Stack spacing={4} alignItems="center" textAlign="center" pt={8} pb={20}>
        <Typography variant="h2" component="h1" sx={{ fontFamily: '"Orbitron", sans-serif' }}>
          {t('app.title')}
        </Typography>
        <Typography variant="h6" component="p" color="text.secondary" maxWidth={600}>
          {t('landing.description')}
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/tools')}>
          {t('landing.access')}
        </Button>
      </Stack>

      <LandingFooter />
    </>
  );
}
