import { Box, Container, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../../i18n/components/LanguageSelector';
import { ThemeToggle } from '../../theme/components/ThemeToggle';
import { MarkdownPreview } from '../../../components/markdown/MarkdownPreview';
import { PageHead } from '../../../components/seo/PageHead';

const config = window.__LEGAL_CONFIG__ ?? {
  owner: 'SMTools',
  email: 'admin@example.com',
  showDisclaimer: true,
};
const LEGAL_OWNER = config.owner;
const LEGAL_EMAIL = config.email;
const SHOW_DISCLAIMER = config.showDisclaimer;

export function LegalPage() {
  const { t } = useTranslation();
  const legalInterpolation = { owner: LEGAL_OWNER, email: LEGAL_EMAIL };

  return (
    <>
      <PageHead title={t('legal.title')} />
      <Container maxWidth="lg" sx={{ pt: 2, pb: 6 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Link
            component={RouterLink}
            to="/"
            underline="none"
            color="inherit"
            sx={{ '&:hover': { textDecoration: 'none' } }}
          >
            <Typography
              variant="h5"
              component="span"
              fontWeight={600}
              sx={{ fontFamily: '"Orbitron", sans-serif', lineHeight: 1 }}
            >
              {t('app.title')}
            </Typography>
          </Link>
          <Stack direction="row" spacing={1} alignItems="center">
            <LanguageSelector compact />
            <ThemeToggle />
          </Stack>
        </Stack>

        <Typography variant="h4" component="h1" gutterBottom>
          {t('legal.title')}
        </Typography>

        {SHOW_DISCLAIMER && (
          <Typography
            variant="body2"
            sx={{
              mb: 4,
              pl: 2,
              borderLeft: 4,
              borderColor: 'warning.main',
              color: 'text.secondary',
              fontStyle: 'italic',
            }}
          >
            {t('legal.disclaimer')}
          </Typography>
        )}

        <Box
          sx={{
            textAlign: 'justify',
            '& a': {
              color: 'inherit',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            },
          }}
        >
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
            {t('legal.owner')}
          </Typography>
          <MarkdownPreview content={t('legal.ownerText', legalInterpolation)} />

          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
            {t('legal.privacyTitle')}
          </Typography>
          <MarkdownPreview content={t('legal.privacyText', legalInterpolation)} />

          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
            {t('legal.cookiesTitle')}
          </Typography>
          <MarkdownPreview content={t('legal.cookiesText')} />
        </Box>
      </Container>
    </>
  );
}
