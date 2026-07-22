import { Box, Link } from '@mui/material';
import { IconBrandGithub } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const config = window.__LEGAL_CONFIG__ ?? {
  owner: 'SMTools',
  email: 'admin@example.com',
  showDisclaimer: true,
};
const LEGAL_EMAIL = config.email;

export function LandingFooter() {
  const { t } = useTranslation();
  return (
    <Box
      component="footer"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        py: 2,
        px: 2,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Link
        href={`mailto:${LEGAL_EMAIL}`}
        sx={{
          color: 'text.primary',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        {t('landing.contact')}
      </Link>
      <Box component="span" sx={{ color: 'text.primary' }}>
        ·
      </Box>
      <Link
        href="https://github.com/rivet92/SMTools"
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          color: 'text.primary',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        <IconBrandGithub size={18} />
        GitHub
      </Link>
      <Box component="span" sx={{ color: 'text.primary' }}>
        ·
      </Box>
      <Link
        href="/legal"
        sx={{
          color: 'text.primary',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        Legal
      </Link>
    </Box>
  );
}
