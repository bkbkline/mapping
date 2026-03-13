import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display the login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /sign in|log in/i })).toBeVisible();
  });

  test('should show email and password fields on login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    // Should show validation feedback
    await expect(page.locator('text=/required|invalid|enter/i')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page.locator('text=/invalid|incorrect|error/i')).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /sign up|create account|register/i }).click();
    await expect(page).toHaveURL(/\/signup|\/register/);
  });

  test('should display signup form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // This test requires valid test credentials set up in the environment
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

    // Should redirect to dashboard or maps page
    await page.waitForURL(/\/(dashboard|maps|$)/);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should log out successfully', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip();
      return;
    }

    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/(dashboard|maps|$)/);

    // Logout
    await page.getByRole('button', { name: /account|profile|menu/i }).click();
    await page.getByRole('menuitem', { name: /log out|sign out/i }).click();

    // Should redirect to login
    await page.waitForURL(/\/login/);
  });
});
