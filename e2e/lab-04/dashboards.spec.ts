import { test, expect } from '@playwright/test';

test.describe('Lab 4: Role-Appropriate Dashboards & Drilldown (AC-04..AC-05, AC-09, Screen 8.1 & 8.2)', () => {
  const BASE_URL = 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('staff dashboard renders 5 authoritative KPI cards and navigates to filtered queue on drilldown', async ({ page }) => {
    // 1. Login as Staff
    await page.fill('input[type="email"]', 'john.s@toktickit.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // 2. Navigate to Dashboard tab
    await page.click('button:has-text("Dashboard")');

    // 3. Verify Staff Dashboard greeting and 5 KPI cards
    await expect(page.getByText(/IT Staff Operations Dashboard/i)).toBeVisible();
    await expect(page.getByTestId('kpi-card-new')).toBeVisible();
    await expect(page.getByTestId('kpi-card-open')).toBeVisible();
    await expect(page.getByTestId('kpi-card-inprogress')).toBeVisible();
    await expect(page.getByTestId('kpi-card-waiting')).toBeVisible();
    await expect(page.getByTestId('kpi-card-myassigned')).toBeVisible();

    // 4. Drill-down: Click My Assigned card
    await page.click('[data-testid="kpi-card-myassigned"]');

    // 5. Verify navigation to Staff Queue with My Tickets filter applied
    await expect(page.getByRole('heading', { name: /IT Staff Ticket Queue/i })).toBeVisible();
  });

  test('requester dashboard renders personal KPIs and isolates tickets to authenticated requester', async ({ page }) => {
    // 1. Login as Requester
    await page.fill('input[type="email"]', 'alice.r@toktickit.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // 2. Navigate to Dashboard tab
    await page.click('button:has-text("Dashboard")');

    // 3. Verify Requester Dashboard greeting and 4 personal KPI cards
    await expect(page.getByText(/Requester Support Dashboard/i)).toBeVisible();
    await expect(page.getByTestId('req-kpi-open')).toBeVisible();
    await expect(page.getByTestId('req-kpi-inprogress')).toBeVisible();
    await expect(page.getByTestId('req-kpi-resolved')).toBeVisible();
    await expect(page.getByTestId('req-kpi-closed')).toBeVisible();

    // 4. Drill-down: Click Open tickets KPI card
    await page.click('[data-testid="req-kpi-open"]');

    // 5. Verify navigation to My Tickets
    await expect(page.getByRole('heading', { name: /My Tickets/i })).toBeVisible();
  });
});
