import { test, expect } from '@playwright/test';

test.describe('Share Modal', () => {
  test.beforeEach(async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip();
      return;
    }

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/(dashboard|maps|app)/);

    // Create a map to share
    await page.goto('/');
    await page.getByRole('button', { name: /new map|create map/i }).click();
    await page.getByLabel(/title|name/i).fill('Share Test Map');
    await page.getByRole('button', { name: /create|save/i }).click();
    await page.waitForURL(/\/maps\/[a-zA-Z0-9-]+/);
  });

  test('should open the share modal', async ({ page }) => {
    await page.getByRole('button', { name: /share/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('text=/share|sharing/i')).toBeVisible();
  });

  test('should show share mode options', async ({ page }) => {
    await page.getByRole('button', { name: /share/i }).click();

    // Should show private, unlisted, public options
    await expect(page.locator('text=/private/i')).toBeVisible();
    await expect(page.locator('text=/unlisted/i')).toBeVisible();
    await expect(page.locator('text=/public/i')).toBeVisible();
  });

  test('should show copy link button', async ({ page }) => {
    await page.getByRole('button', { name: /share/i }).click();
    await expect(
      page.getByRole('button', { name: /copy link|copy url|copy/i })
    ).toBeVisible();
  });

  test('should switch share mode to unlisted', async ({ page }) => {
    await page.getByRole('button', { name: /share/i }).click();

    // Click unlisted option
    await page.locator('text=/unlisted/i').click();

    // Should show confirmation or the mode should be active
    await expect(page.locator('[data-active="true"]')).toBeVisible();
  });

  test('should show invite by email field', async ({ page }) => {
    await page.getByRole('button', { name: /share/i }).click();

    // Should have an email input for inviting collaborators
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  });

  test('should close share modal', async ({ page }) => {
    await page.getByRole('button', { name: /share/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Close the modal
    await page.getByRole('button', { name: /close|cancel|×/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
