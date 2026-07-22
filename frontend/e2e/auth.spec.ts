import { test, expect } from '@playwright/test';
import { mockUnauthenticatedUser } from './helpers/auth';

test.describe('Authentication', () => {
  test('shows landing page for unauthenticated users on /', async ({ page }) => {
    await mockUnauthenticatedUser(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'SMTools' })).toBeVisible();
  });

  test('redirects to login when accessing protected route', async ({ page }) => {
    await mockUnauthenticatedUser(page);
    await page.goto('/tools/notes');
    await expect(page.getByText('Sign in to SMTools')).toBeVisible();
  });

  test('shows OAuth login options', async ({ page }) => {
    await mockUnauthenticatedUser(page);
    await page.goto('/tools/notes');
    await expect(page.getByText('Sign in to SMTools')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with GitHub' })).toBeVisible();
  });
});
