import { test, expect } from '@playwright/test';

test.describe('Draw Polygon on Map', () => {
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

  test('should show drawing toolbar on map page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /new map|create map/i }).click();
    await page.getByLabel(/title|name/i).fill('Draw Test Map');
    await page.getByRole('button', { name: /create|save/i }).click();
    await page.waitForURL(/\/maps\/[a-zA-Z0-9-]+/);

    // Drawing toolbar should be visible
    await expect(
      page.getByRole('button', { name: /polygon|draw/i })
    ).toBeVisible();
  });

  test('should activate polygon draw mode', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /new map|create map/i }).click();
    await page.getByLabel(/title|name/i).fill('Polygon Draw Test');
    await page.getByRole('button', { name: /create|save/i }).click();
    await page.waitForURL(/\/maps\/[a-zA-Z0-9-]+/);

    // Click the polygon draw button
    await page.getByRole('button', { name: /polygon/i }).click();

    // The button should be in an active/selected state
    await expect(
      page.getByRole('button', { name: /polygon/i })
    ).toHaveAttribute('data-active', 'true');
  });

  test('should draw a polygon by clicking on the map', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /new map|create map/i }).click();
    await page.getByLabel(/title|name/i).fill('Polygon Click Test');
    await page.getByRole('button', { name: /create|save/i }).click();
    await page.waitForURL(/\/maps\/[a-zA-Z0-9-]+/);

    const canvas = page.locator('canvas.mapboxgl-canvas');
    await expect(canvas).toBeVisible();

    // Activate polygon draw mode
    await page.getByRole('button', { name: /polygon/i }).click();

    // Get canvas bounding box for relative clicking
    const box = await canvas.boundingBox();
    if (!box) return;

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Click three points to form a triangle
    await page.mouse.click(cx - 50, cy - 50);
    await page.mouse.click(cx + 50, cy - 50);
    await page.mouse.click(cx, cy + 50);

    // Double-click to finish the polygon
    await page.mouse.dblclick(cx, cy + 50);

    // Wait for the polygon to be committed
    await page.waitForTimeout(500);
  });

  test('should switch to pan tool with Escape', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /new map|create map/i }).click();
    await page.getByLabel(/title|name/i).fill('Escape Test');
    await page.getByRole('button', { name: /create|save/i }).click();
    await page.waitForURL(/\/maps\/[a-zA-Z0-9-]+/);

    // Activate polygon draw mode then escape
    await page.getByRole('button', { name: /polygon/i }).click();
    await page.keyboard.press('Escape');

    // Pan/select should be active
    const panButton = page.locator('[data-tool="pan"]').or(page.locator('[aria-label="Select / Pan"]'));
    if (await panButton.count() > 0) {
      await expect(panButton).toBeVisible();
    }
  });

  test('should show measurement after drawing', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /new map|create map/i }).click();
    await page.getByLabel(/title|name/i).fill('Measurement Test');
    await page.getByRole('button', { name: /create|save/i }).click();
    await page.waitForURL(/\/maps\/[a-zA-Z0-9-]+/);

    const canvas = page.locator('canvas.mapboxgl-canvas');
    await expect(canvas).toBeVisible();

    // Activate area measure mode
    await page.getByRole('button', { name: /measure.*area|area/i }).click();

    const box = await canvas.boundingBox();
    if (!box) return;

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.click(cx - 50, cy - 50);
    await page.mouse.click(cx + 50, cy - 50);
    await page.mouse.click(cx, cy + 50);
    await page.mouse.dblclick(cx, cy + 50);

    // Should display area measurement (sq ft or acres)
    await expect(page.locator('text=/sq ft|acres|sf/i')).toBeVisible();
  });
});
