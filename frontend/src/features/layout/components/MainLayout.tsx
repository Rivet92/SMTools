import { Box, Container, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { LandingHeader } from '../../landing/components/LandingHeader';
import { UserMenu } from '../../auth/components/UserMenu';
import { Breadcrumbs } from './Breadcrumbs';
import { CookieConsent } from './CookieConsent';

export function MainLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <Container
      maxWidth="lg"
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        py: isLanding ? 4 : 2,
      }}
    >
      <Stack
        direction="row"
        justifyContent={isLanding ? 'center' : 'flex-start'}
        alignItems="center"
        spacing={isLanding ? 0 : 2}
        mb={isLanding ? 2 : 1}
      >
        {!isLanding && (
          <Link component={RouterLink} to="/" color="inherit" underline="none">
            <Typography
              variant="h5"
              component="div"
              fontWeight={600}
              sx={{
                fontFamily: '"Orbitron", sans-serif',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                height: 36,
              }}
            >
              SMTools
            </Typography>
          </Link>
        )}
        {!isLanding && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Breadcrumbs />
          </Box>
        )}
        {isLanding ? <LandingHeader /> : <UserMenu />}
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Box>
      <CookieConsent />
    </Container>
  );
}
