import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const getInitialMode = (): ThemeMode => {
  const saved = localStorage.getItem('smtools-theme') as ThemeMode | null;
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: getInitialMode(),
  toggleMode: () =>
    set((state) => {
      const next = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('smtools-theme', next);
      return { mode: next };
    }),
  setMode: (mode) => {
    localStorage.setItem('smtools-theme', mode);
    set({ mode });
  },
}));
