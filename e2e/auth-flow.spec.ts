import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session data
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should redirect to login when accessing protected admin route without authentication', async ({
    page,
  }) => {
    await page.goto('/admin');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Admin Login');
  });

  test('should successfully login with valid admin credentials', async ({
    page,
  }) => {
    await page.goto('/login');

    // Fill in login form
    await page.fill('input[type="email"]', 'admin@marketmotors.com');
    await page.fill('input[type="password"]', 'admin123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should be redirected to admin dashboard
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error message with invalid credentials', async ({
    page,
  }) => {
    await page.goto('/login');

    // Fill in login form with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('[role="alert"]')).toContainText(
      'Invalid credentials'
    );
  });

  test('should maintain session across page refreshes', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@marketmotors.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Verify we're on admin dashboard
    await expect(page).toHaveURL('/admin');

    // Refresh the page
    await page.reload();

    // Should still be on admin dashboard (session maintained)
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should logout successfully and redirect to login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@marketmotors.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Verify we're logged in
    await expect(page).toHaveURL('/admin');

    // Click logout (assuming there's a logout button in the UI)
    await page.click('[data-testid="logout-button"]');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');

    // Verify we can't access protected routes after logout
    await page.goto('/admin');
    await expect(page).toHaveURL('/login');
  });

  test('should handle manager role access correctly', async ({ page }) => {
    await page.goto('/login');

    // Login with manager credentials
    await page.fill('input[type="email"]', 'manager@marketmotors.com');
    await page.fill('input[type="password"]', 'manager123');
    await page.click('button[type="submit"]');

    // Should be able to access admin dashboard
    await expect(page).toHaveURL('/admin');

    // Should not be able to access super admin routes
    await page.goto('/admin/users');
    await expect(page).toHaveURL('/login'); // Should be redirected due to insufficient permissions
  });

  test('should show loading state during authentication check', async ({
    page,
  }) => {
    await page.goto('/admin');

    // Should see loading state before redirect
    const loadingIndicator = page.locator('.animate-spin');
    await expect(loadingIndicator).toBeVisible();
  });

  test('should handle forgot password flow', async ({ page }) => {
    await page.goto('/login');

    // Click forgot password link
    await page.click('text=Forgot Password');

    // Should navigate to forgot password page
    await expect(page).toHaveURL('/forgot-password');

    // Fill in email
    await page.fill('input[type="email"]', 'admin@marketmotors.com');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('[role="alert"]')).toContainText(
      'Password reset link sent'
    );
  });

  test('should handle unauthorized access gracefully', async ({ page }) => {
    // Try to access a route that doesn't exist or requires special permissions
    await page.goto('/admin/super-secret-route');

    // Should show unauthorized or not found page
    await expect(page.locator('h1')).toContainText([
      '404',
      'Unauthorized',
      'Not Found',
    ]);
  });
});
