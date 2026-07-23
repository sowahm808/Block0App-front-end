import { expect, test } from '@playwright/test';

test.describe('remaining route coverage @smoke', () => {
  test('wildcard routes render NotFoundPage', async ({ page }) => {
    await page.goto('/definitely-not-a-real-route');
    await expect(page.getByRole('heading', { name: /not found/i })).toBeVisible();
  });

  test('public certificate verification workflow renders verified credential details', async ({ page }) => {
    await page.route('**/api/v1/public/certificates/verify/demo-code', async (route) => {
      await route.fulfill({ json: { valid: true, certificateNumber: 'B0-DEMO', challengeName: 'Block Zero 21-Day Challenge', issueDate: '2026-07-22', revoked: false } });
    });
    await page.goto('/certificate/verify/demo-code');
    await expect(page.getByRole('heading', { name: /certificate verification/i })).toBeVisible();
    await expect(page.getByText('B0-DEMO')).toBeVisible();
    await expect(page.getByText('Block Zero 21-Day Challenge')).toBeVisible();
  });

  test('login workflow surfaces backend credential errors', async ({ page }) => {
    await page.route('**/identitytoolkit/**', async (route) => {
      await route.fulfill({ status: 400, json: { error: { message: 'INVALID_PASSWORD' } } });
    });
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('scholar@example.com');
    await page.getByLabel(/password/i).fill('wrong-password');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page.getByText(/invalid password|unable to sign in|login failed/i)).toBeVisible();
  });
});
