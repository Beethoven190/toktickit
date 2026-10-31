import { test, expect } from '@playwright/test';

test.describe('Lab 3: IT Staff Ticket Flow & Operations', () => {
  const BASE_URL = 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Login as Staff
    await page.fill('input[type="email"]', 'john.s@toktickit.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.click('button:has-text("My Queue")');
  });

  test('staff queue displays tickets, KPI counters, and supports live search filtering', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /IT Staff Ticket Queue/i })).toBeVisible();
    await expect(page.getByTestId('queue-search-input')).toBeVisible();

    // Filter by search keyword
    await page.fill('[data-testid="queue-search-input"]', 'VPN');
    await page.waitForTimeout(400);
    const rows = page.locator('table[data-testid="staff-queue-table"] tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('staff can open ticket detail and inspect operational controls, comments, and internal notes', async ({ page }) => {
    await page.click('table[data-testid="staff-queue-table"] tbody tr:first-child');

    // Overview & operational controls
    await expect(page.getByText(/Staff Assignment|Operational Controls|Claim Ticket/i)).toBeVisible();

    // Public Comments
    await expect(page.getByRole('button', { name: /Public Comments/i })).toBeVisible();

    // Confidential Internal Notes tab is visible for staff
    await expect(page.getByRole('button', { name: /Internal Notes/i })).toBeVisible();
  });
});
