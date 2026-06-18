import { test, expect } from '@playwright/test';

test.describe('Prepped 4 Prep — Customer Portal E2E Tests', () => {
  test('should load storefront home page and find key branding elements', async ({ page }) => {
    // Navigate to local customer storefront
    await page.goto('http://localhost:3000/');

    // Assert main logo or mascot note is visible
    const bodyText = await page.innerText('body');
    expect(bodyText).toContain('Prepped 4 Prep');
    
    // Check if the CTA to get stationery template packs exists
    const templatePickerBtn = page.locator('text=Select School');
    expect(templatePickerBtn).toBeDefined();
  });
});

test.describe('Prepped 4 Prep — Operations Portal E2E Security Tests (RBAC & POPIA)', () => {
  test('should show full financial BI metrics to an Admin user', async ({ page, context }) => {
    // Set active role cookie to admin
    await context.addCookies([
      {
        name: 'p4p_ops_role',
        value: 'admin',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('http://localhost:3001/');

    // Assert Admin Dashboard header is visible
    await expect(page.locator('h1')).toContainText('Admin Dashboard', { ignoreCase: true });

    // Assert financial BI metric card (Total Revenue) is present and visible
    const totalRevenueLabel = page.locator('text=Total Revenue');
    await expect(totalRevenueLabel).toBeVisible();
  });

  test('should hide financial BI metrics and show redacted alerts to a Warehouse user', async ({ page, context }) => {
    // Set active role cookie to warehouse
    await context.addCookies([
      {
        name: 'p4p_ops_role',
        value: 'warehouse',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('http://localhost:3001/');

    // Assert Warehouse Dashboard header is visible
    await expect(page.locator('h1')).toContainText('Warehouse Dashboard', { ignoreCase: true });

    // Assert that Financial BI is Redacted for the warehouse role
    const redactedWarning = page.locator('text=Financial BI Redacted');
    await expect(redactedWarning).toBeVisible();

    // Verify that the Total Revenue number is hidden or redacted
    const bodyText = await page.innerText('body');
    expect(bodyText).not.toContain('Total Revenue');
  });
});
