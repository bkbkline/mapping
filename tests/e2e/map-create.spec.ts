import { test, expect } from '@playwright/test';

test.describe('Create New Map', () => {
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

  test('should show create map button on dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: /new map|create map/i })
    ).toBeVisible();
  });

  test('should open new map dialog or page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /new map|create map/i }).click();

    // Should show a title input
    await expect(page.getByLabel(/title|name/i)).toBeVisible();
  });

  test('should create a map with a title', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /new map|create map/i }).click();

    const mapTitle = `Test Map ${Date.now()}`;
    await page.getByLabel(/title|name/i).fill(mapTitle);
    await page.getByRole('button', { name: /create|save/i }).click();

    // Should navigate to the map view
    await page.waitForURL(/\/maps\/[a-zA-Z0-9-]+/);

    // The map title should be visible somewhere on the page
    await expect(page.locator(`text=${mapTitle}`)).toBeVisible();
  });

  test('should show map canvas after creation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /new map|create map/i }).click();

    await page.getByLabel(/title|name/i).fill('Canvas Test Map');
    await page.getByRole('button', { name: /create|save/i }).click();

    await page.waitForURL(/\/maps\/[a-zA-Z0-9-]+/);

    // Mapbox GL canvas should be present
    await expect(page.locator('canvas.mapboxgl-canvas')).toBeVisible();
  });

  test('should validate empty title', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /new map|create map/i }).click();

    // Try to create without title
    await page.getByRole('button', { name: /create|save/i }).click();

    // Should show validation error
    await expect(page.locator('text=/required|title/i')).toBeVisible();
  });
});
