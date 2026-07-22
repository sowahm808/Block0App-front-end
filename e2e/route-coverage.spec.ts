import { expect, test } from '@playwright/test';

test.describe('remaining route coverage @smoke', () => {
  test('wildcard routes render NotFoundPage', async ({ page }) => {
    await page.goto('/definitely-not-a-real-route');
    await expect(page.getByRole('heading', { name: /not found/i })).toBeVisible();
  });

  test('public certificate verification route is reachable', async ({ page }) => {
    await page.route('**/api/v1/public/certificates/verify/demo-code', async (route) => {
      await route.fulfill({ json: { valid: true, certificateNumber: 'B0-DEMO', challengeName: 'Block Zero 21-Day Challenge', issueDate: '2026-07-22', revoked: false } });
    });
    await page.goto('/certificate/verify/demo-code');
    await expect(page.getByRole('heading', { name: /certificate verification/i })).toBeVisible();
  });
});
