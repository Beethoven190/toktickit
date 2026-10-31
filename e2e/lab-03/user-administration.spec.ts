import { test, expect } from '@playwright/test';

test.describe('Lab 3: Administrator User Management & Safety Controls', () => {
  const BASE_URL = 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Login as Admin
    await page.fill('input[type="email"]', 'admin@toktickit.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.click('button:has-text("User Management")');
  });

  test('admin user management table lists users and opens create drawer', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /User Management/i })).toBeVisible();
    await expect(page.getByTestId('create-user-btn')).toBeVisible();

    // Open create user drawer
    await page.click('[data-testid="create-user-btn"]');
    await expect(page.getByTestId('user-form-name')).toBeVisible();
    await expect(page.getByTestId('user-form-email')).toBeVisible();
    await expect(page.getByTestId('user-form-role')).toBeVisible();
    await expect(page.getByTestId('user-form-password')).toBeVisible();
  });

  test('self-deactivation guard disables active toggle for currently logged-in administrator', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'System Administrator');
    await page.waitForTimeout(400);
    await page.click('tr:has-text("System Administrator")');

    const switchInput = page.getByTestId('user-form-active-switch');
    await expect(switchInput).toBeDisabled();
  });
});
