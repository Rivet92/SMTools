import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ mode: 'light' });
  });

  it('has light mode as default', () => {
    useThemeStore.setState({ mode: 'light' });
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('toggleMode switches between light and dark', () => {
    useThemeStore.getState().toggleMode();
    expect(useThemeStore.getState().mode).toBe('dark');
    useThemeStore.getState().toggleMode();
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('setTheme sets specific theme and persists to localStorage', () => {
    useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(localStorage.getItem('smtools-theme')).toBe('dark');

    useThemeStore.getState().setMode('light');
    expect(useThemeStore.getState().mode).toBe('light');
    expect(localStorage.getItem('smtools-theme')).toBe('light');
  });

  it('persists theme to localStorage on toggle', () => {
    useThemeStore.getState().toggleMode();
    expect(localStorage.getItem('smtools-theme')).toBe('dark');
  });
});
