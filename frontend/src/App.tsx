import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Box, CircularProgress, CssBaseline } from '@mui/material';
import { useInitI18n } from './features/i18n/hooks/use-init-i18n';
import { useDocumentLang } from './features/seo/hooks/useDocumentLang';
import { RootErrorBoundary } from './components/error/RootErrorBoundary';
import { PageFallback } from './components/PageFallback';
import { router } from './router';

export default function App() {
  const { isReady } = useInitI18n();
  useDocumentLang();

  return (
    <>
      <CssBaseline />
      {isReady ? (
        <RootErrorBoundary>
          <Suspense fallback={<PageFallback />}>
            <RouterProvider router={router} />
          </Suspense>
        </RootErrorBoundary>
      ) : (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <CircularProgress />
        </Box>
      )}
    </>
  );
}
