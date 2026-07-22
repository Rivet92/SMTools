import { test, expect } from '@playwright/test';
import { loginAsE2eUser } from './helpers/auth';

test.describe('Notes', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsE2eUser(page);
  });

  test('notes page shows empty state', async ({ page }) => {
    await page.goto('/tools/notes');

    await expect(page.getByText('Notes')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New note' })).toBeVisible();
  });

  test('create a new note', async ({ page }) => {
    await page.goto('/tools/notes');

    await page.getByRole('button', { name: 'New note' }).click();
    await page.getByPlaceholder('Note title').fill('E2E Test Note');
    await page.getByPlaceholder('Write your note in markdown...').fill('This is an E2E test note');

    await expect(page.getByText('E2E Test Note')).toBeVisible();
  });

  test('archives a note', async ({ page }) => {
    await page.goto('/tools/notes');

    await page.getByRole('button', { name: 'New note' }).click();
    await page.getByPlaceholder('Note title').fill('Note to Archive');
    await page.getByPlaceholder('Write your note in markdown...').fill('Will be archived');

    await page.getByRole('button', { name: 'Archive' }).click();

    await expect(page.getByText('Note to Archive')).not.toBeVisible();
    await expect(page.getByText('Archived notes')).toBeVisible();
  });
});
