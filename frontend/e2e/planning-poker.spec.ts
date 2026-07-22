import { test, expect } from '@playwright/test';
import { mockAuthenticatedUser } from './helpers/auth';

test.describe('Planning Poker', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page);
  });

  test('room lobby shows create room button', async ({ page }) => {
    await page.goto('/tools/planning-poker');
    await expect(page.getByText('My rooms')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New room' })).toBeVisible();
  });

  test('create room form validation requires title', async ({ page }) => {
    await page.goto('/tools/planning-poker');
    await page.getByRole('button', { name: 'New room' }).click();

    await expect(page.getByLabel('Room title')).toBeVisible();
    const createButton = page.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeDisabled();
  });

  test('create room flow', async ({ page }) => {
    await page.goto('/tools/planning-poker');
    await page.getByRole('button', { name: 'New room' }).click();

    await page.getByLabel('Room title').fill('E2E Test Room');
    await page.getByRole('button', { name: 'Create' }).click();

    await page.waitForURL(/\/tools\/planning-poker\/(?!lobby)/);
  });
});
