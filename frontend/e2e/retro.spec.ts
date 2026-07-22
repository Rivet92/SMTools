import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/auth';

test.describe('Retrospective', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
  });

  test('lobby shows create retrospective button', async ({ page }) => {
    await page.goto('/tools/retro');
    await expect(page.getByText('My retrospectives')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New retrospective' })).toBeVisible();
  });

  test('create retro form requires title', async ({ page }) => {
    await page.goto('/tools/retro');
    await page.getByRole('button', { name: 'New retrospective' }).click();

    await expect(page.getByRole('textbox', { name: 'Room' })).toBeVisible();
    const createButton = page.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeDisabled();
  });

  test('create retro room flow', async ({ page }) => {
    await page.goto('/tools/retro');
    await page.getByRole('button', { name: 'New retrospective' }).click();

    await page.getByRole('textbox', { name: 'Room' }).fill('E2E Test Retro');
    await page.getByRole('button', { name: 'Create' }).click();

    await page.waitForURL(/\/tools\/retro\/(?!$)/);
  });
});
