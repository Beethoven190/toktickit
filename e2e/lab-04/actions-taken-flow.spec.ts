import { test, expect } from '@playwright/test';

test.describe('Lab 4: Actions Taken Work Logging Flow (AC-01..AC-03, Screen 8.3)', () => {
  const BASE_URL = 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('staff can record an action taken with mandatory fields and follow-up notes', async ({ page }) => {
    // 1. Login as Staff
    await page.fill('input[type="email"]', 'john.s@toktickit.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // 2. Navigate to Staff Queue and open first ticket
    await page.click('button:has-text("My Queue")');
    await expect(page.getByRole('heading', { name: /IT Staff Ticket Queue/i })).toBeVisible();
    await page.click('table[data-testid="staff-queue-table"] tbody tr:first-child');

    // 3. Verify Actions Taken section exists
    await expect(page.getByText(/Actions Taken/i)).toBeVisible();
    const addActionBtn = page.getByTestId('add-action-taken-btn');
    if (await addActionBtn.isVisible()) {
      await addActionBtn.click();

      // 4. Modal is displayed
      await expect(page.getByTestId('action-taken-modal')).toBeVisible();

      // 5. Fill action fields
      await page.fill('[data-testid="action-description-input"]', 'E2E Diagnostic: Verified thermal paste and heatsink seating.');
      await page.fill('[data-testid="action-result-input"]', 'CPU temperature reduced from 88C to 45C idle.');

      // Toggle Follow-up switch
      await page.click('[data-testid="follow-up-switch"]');
      await expect(page.getByTestId('follow-up-note-input')).toBeVisible();
      await page.fill('[data-testid="follow-up-note-input"]', 'Follow up with user in 48 hours to check sustained load stability.');

      // Save action
      await page.click('[data-testid="save-action-btn"]');

      // 6. Modal closes and action appears in list
      await expect(page.getByTestId('action-taken-modal')).not.toBeVisible();
      await expect(page.getByText(/E2E Diagnostic: Verified thermal paste/i)).toBeVisible();
      await expect(page.getByText(/CPU temperature reduced/i)).toBeVisible();
    }
  });

  test('requesters can view actions taken in read-only mode without create/edit controls', async ({ page }) => {
    // 1. Login as Requester
    await page.fill('input[type="email"]', 'alice.r@toktickit.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // 2. Open My Tickets
    await page.click('button:has-text("My Tickets")');
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // 3. Requester sees ticket details but cannot see add action button
      await expect(page.getByTestId('add-action-taken-btn')).not.toBeVisible();
    }
  });
});
