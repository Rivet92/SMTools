import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

const origConsoleWarn = console.warn;
const origConsoleError = console.error;

console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('i18next')) return;
  origConsoleWarn.call(console, ...args);
};

console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return;
  origConsoleError.call(console, ...args);
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
