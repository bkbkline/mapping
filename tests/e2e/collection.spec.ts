import { test, expect } from '@playwright/test';

test.describe('Collections', () => {
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
  });

  test('should navigate to collections page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /collections/i }).click();
    await expect(page).toHaveURL(/\/collections/);
  });

  test('should show create collection button', async ({ page }) => {
    await page.goto('/collections');
    await expect(
      page.getByRole('button', { name: /new collection|create collection/i })
    ).toBeVisible();
  });

  test('should create a new collection', async ({ page }) => {
    await page.goto('/collections');
    await page.getByRole('button', { name: /new collection|create collection/i }).click();

    const collectionTitle = `Test Collection ${Date.now()}`;
    await page.getByLabel(/title|name/i).fill(collectionTitle);
    await page.getByRole('button', { name: /create|save/i }).click();

    // Should show the new collection
    await expect(page.locator(`text=${collectionTitle}`)).toBeVisible();
  });

  test('should open a collection detail view', async ({ page }) => {
    await page.goto('/collections');
    await page.getByRole('button', { name: /new collection|create collection/i }).click();

    const collectionTitle = `Detail Test ${Date.now()}`;
    await page.getByLabel(/title|name/i).fill(collectionTitle);
    await page.getByRole('button', { name: /create|save/i }).click();

    // Click into the collection
    await page.locator(`text=${collectionTitle}`).click();
    await expect(page).toHaveURL(/\/collections\/[a-zA-Z0-9-]+/);
  });

  test('should add a parcel to a collection', async ({ page }) => {
    // Create a collection first
    await page.goto('/collections');
    await page.getByRole('button', { name: /new collection|create collection/i }).click();

    const collectionTitle = `Parcel Add Test ${Date.now()}`;
    await page.getByLabel(/title|name/i).fill(collectionTitle);
    await page.getByRole('button', { name: /create|save/i }).click();

    // Open the collection
    await page.locator(`text=${collectionTitle}`).click();
    await expect(page).toHaveURL(/\/collections\/[a-zA-Z0-9-]+/);

    // Click add parcel button
    await page.getByRole('button', { name: /add parcel|add property/i }).click();

    // Search for a parcel (assumes parcels exist in the DB)
    const searchInput = page.getByPlaceholder(/search|apn|address/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Main');
    await page.waitForTimeout(500); // Wait for search results

    // Click the first result if available
    const firstResult = page.locator('[data-testid="parcel-result"]').first();
    if (await firstResult.isVisible()) {
      await firstResult.click();

      // The parcel should now appear in the collection
      await expect(
        page.locator('[data-testid="collection-item"]')
      ).toHaveCount(1);
    }
  });

  test('should show empty state for new collection', async ({ page }) => {
    await page.goto('/collections');
    await page.getByRole('button', { name: /new collection|create collection/i }).click();

    const collectionTitle = `Empty Test ${Date.now()}`;
    await page.getByLabel(/title|name/i).fill(collectionTitle);
    await page.getByRole('button', { name: /create|save/i }).click();

    await page.locator(`text=${collectionTitle}`).click();

    // Should show empty state message
    await expect(
      page.locator('text=/no parcels|empty|add.*parcel|get started/i')
    ).toBeVisible();
  });
});
