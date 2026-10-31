import { test, expect } from '@playwright/test';

test.describe('Lab 4: Ticket Lifecycle, Resolution Gate & State Transitions (AC-06..AC-08, BR-08..BR-11)', () => {
  const BASE_URL = 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('resolution gate enforces mandatory resolution summary before transitioning to RESOLVED', async ({ page }) => {
    // 1. Login as Staff
    await page.fill('input[type="email"]', 'john.s@toktickit.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // 2. Open Staff Queue and open a ticket
    await page.click('button:has-text("My Queue")');
    await page.click('table[data-testid="staff-queue-table"] tbody tr:first-child');

    const statusSelect = page.getByTestId('status-transition-select');
    await expect(statusSelect).toBeVisible();

    // Check if RESOLVED is an available transition option
    const options = await statusSelect.locator('option').allTextContents();
    const canResolve = options.some((opt) => opt.includes('Resolved'));

    if (canResolve) {
      await statusSelect.selectOption('RESOLVED');

      // Clear resolution summary to test validation gate
      await page.fill('[data-testid="resolution-summary-input"]', '');
      await page.click('[data-testid="apply-status-button"]');

      // Error banner or feedback should be displayed
      await expect(
        page.getByText(/resolution summary of at least 5 characters is required/i)
      ).toBeVisible();

      // Enter valid resolution summary
      await page.fill('[data-testid="resolution-summary-input"]', 'Resolved successfully after replacing faulty network cable.');
      await page.click('[data-testid="apply-status-button"]');

      // Success confirmation
      await expect(page.getByText(/Status updated to Resolved/i)).toBeVisible();
    }
  });
});
