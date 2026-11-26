import { test, expect } from '@playwright/test';

test.describe('Prepped 4 Prep — Customer Portal E2E Tests', () => {
  test('should load storefront home page and find key branding elements', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    const bodyText = await page.innerText('body');
    expect(bodyText).toContain('Prepped 4 Prep');

    const templatePickerHeading = page.locator('text=Find Your School List');
    await expect(templatePickerHeading).toBeVisible();
  });

  test('should load public POPIA Privacy Notice page', async ({ page }) => {
    await page.goto('http://localhost:3000/privacy');
    await expect(page.locator('h1')).toContainText('Privacy & POPIA Notice');
  });
});

test.describe('Prepped 4 Prep — Operations Portal E2E Security Tests (RBAC & Auth)', () => {
  test('should redirect unauthenticated users away from protected Ops routes to /login', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should reject unauthenticated requests to Ops API routes', async ({ request }) => {
    const scanRes = await request.post('http://localhost:3001/api/packing/scan', {
      data: { orderId: 'test-order', sku: 'TEST-SKU' },
    });
    expect([401, 403, 307, 302]).toContain(scanRes.status());
  });
});
