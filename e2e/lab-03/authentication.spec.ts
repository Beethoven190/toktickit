import { test, expect } from '@playwright/test';

test.describe('Lab 3: Authentication & Password Change Flows', () => {
  const BASE_URL = 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('valid login with staff account navigates to staff workspace', async ({ page }) => {
    await page.fill('input[type="email"]', 'john.s@toktickit.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page.getByRole('button', { name: /My Queue/i })).toBeVisible();
    await expect(page.getByTestId('profile-dropdown-btn')).toContainText('John');
  });

  test('invalid login credentials display server error banner', async ({ page }) => {
    await page.fill('input[type="email"]', 'admin@toktickit.local');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-danger')).toBeVisible();
  });

  test('deactivated account cannot log into the platform', async ({ page }) => {
    await page.fill('input[type="email"]', 'old.s@toktickit.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-danger')).toContainText(/deactivated|inactive/i);
  });

  test('mandatory first-login password change quarantine is enforced', async ({ page }) => {
    await page.fill('input[type="email"]', 'newbie.requester@toktickit.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/Mandatory Password Change|Must change password/i)).toBeVisible();
  });

  test('logout action clears session and blocks direct access', async ({ page }) => {
    await page.fill('input[type="email"]', 'john.s@toktickit.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await page.click('[data-testid="profile-dropdown-btn"]');
    await page.click('button:has-text("Sign Out")');

    await expect(page.locator('input[type="email"]')).toBeVisible();
    const token = await page.evaluate(() => localStorage.getItem('toktickit_token'));
    expect(token).toBeNull();
  });
});
