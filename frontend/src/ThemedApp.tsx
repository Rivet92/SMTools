import { useMemo } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import App from './App.tsx';
import { getTheme } from './theme';
import { useThemeStore } from './features/theme/store/themeStore';
import { queryClient } from './queryClient';
import { SnackbarProvider } from './components/feedback/SnackbarProvider';

export function ThemedApp() {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getTheme(mode), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
          <App />
        </SnackbarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
