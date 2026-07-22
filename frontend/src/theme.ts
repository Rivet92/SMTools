import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { ThemeMode } from './features/theme/store/themeStore';

const themeCache: Partial<Record<ThemeMode, Theme>> = {};

export const getTheme = (mode: ThemeMode): Theme => {
  if (themeCache[mode]) {
    return themeCache[mode];
  }
  const theme = createTheme({
    palette: {
      mode,
      background: {
        default: mode === 'dark' ? '#0f172a' : '#f8fafc',
        paper: mode === 'dark' ? '#1e293b' : '#ffffff',
      },
      primary: {
        main: mode === 'dark' ? '#60a5fa' : '#2563eb',
        light: mode === 'dark' ? '#93c5fd' : '#60a5fa',
        dark: mode === 'dark' ? '#3b82f6' : '#1d4ed8',
        contrastText: mode === 'dark' ? '#0f172a' : '#ffffff',
      },
      secondary: {
        main: mode === 'dark' ? '#a78bfa' : '#7c3aed',
        light: mode === 'dark' ? '#c4b5fd' : '#a78bfa',
        dark: mode === 'dark' ? '#8b5cf6' : '#6d28d9',
        contrastText: '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#f8fafc' : '#0f172a',
        secondary: mode === 'dark' ? '#cbd5e1' : '#475569',
      },
      divider: mode === 'dark' ? '#334155' : '#e2e8f0',
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { color: mode === 'dark' ? '#f8fafc' : '#0f172a' },
      h2: { color: mode === 'dark' ? '#f8fafc' : '#0f172a' },
      h3: { color: mode === 'dark' ? '#f8fafc' : '#0f172a' },
      h4: { color: mode === 'dark' ? '#f8fafc' : '#0f172a' },
      h5: { color: mode === 'dark' ? '#f8fafc' : '#0f172a' },
      h6: { color: mode === 'dark' ? '#f8fafc' : '#0f172a' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === 'dark' ? '#0f172a' : '#f8fafc',
            color: mode === 'dark' ? '#f8fafc' : '#0f172a',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e293b' : '#ffffff',
            boxShadow:
              mode === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e293b' : '#ffffff',
          },
        },
      },
    },
  });
  themeCache[mode] = theme;
  return theme;
};
