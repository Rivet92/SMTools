import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/auth';

test.describe('Kanban', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
  });

  test('lobby shows create board button', async ({ page }) => {
    await page.goto('/tools/kanban');
    await expect(page.getByText('My kanban boards')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New board' })).toBeVisible();
  });

  test('create board form requires title', async ({ page }) => {
    await page.goto('/tools/kanban');
    await page.getByRole('button', { name: 'New board' }).click();

    await expect(page.getByRole('textbox', { name: 'Board' })).toBeVisible();
    const createButton = page.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeDisabled();
  });

  test('create board flow', async ({ page }) => {
    await page.goto('/tools/kanban');
    await page.getByRole('button', { name: 'New board' }).click();

    await page.getByRole('textbox', { name: 'Board' }).fill('E2E Test Board');
    await page.getByRole('button', { name: 'Create' }).click();

    await page.waitForURL(/\/tools\/kanban\/(?!$)/);
  });
});
