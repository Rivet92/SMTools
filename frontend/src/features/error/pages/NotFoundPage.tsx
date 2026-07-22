import { Container, Button, Stack, Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../../components/seo/PageHead';
import { LandingHeader } from '../../landing/components/LandingHeader';

export function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <PageHead
        title={t('seo.notFound.title')}
        description={t('seo.notFound.description')}
        noIndex
      />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="center" alignItems="center" mb={4}>
          <LandingHeader />
        </Stack>
        <Stack spacing={4} alignItems="center" textAlign="center" py={2}>
          <Box
            component="img"
            src="/NotFound.png"
            alt="404 illustration"
            sx={{ maxWidth: 300, width: '100%', height: 'auto' }}
          />
          <Typography variant="body1" color="text.secondary" maxWidth={480}>
            {t('notFound.message')}
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/')}>
            {t('notFound.backHome')}
          </Button>
        </Stack>
      </Container>
    </>
  );
}
