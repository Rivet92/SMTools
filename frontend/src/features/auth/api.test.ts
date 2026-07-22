import { describe, it, expect } from 'vitest';
import { startOAuthLogin } from './api';

describe('startOAuthLogin', () => {
  it('sets window location for google with returnUrl', () => {
    const originalLocation = window.location;
    const mockHref = { href: '' };
    Object.defineProperty(window, 'location', {
      value: mockHref,
      writable: true,
    });

    startOAuthLogin('google', '/dashboard');

    expect(mockHref.href).toBe('/api/auth/login/google?returnUrl=%2Fdashboard');

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('uses default returnUrl', () => {
    const originalLocation = window.location;
    const mockHref = { href: '' };
    Object.defineProperty(window, 'location', {
      value: mockHref,
      writable: true,
    });

    startOAuthLogin('github');

    expect(mockHref.href).toBe('/api/auth/login/github?returnUrl=%2F');

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });
});
