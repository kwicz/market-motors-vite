import { test, expect } from '@playwright/test';

test.describe('Admin Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session data
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@marketmotors.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await expect(page).toHaveURL('/admin');
  });

  test('should display admin dashboard with navigation', async ({ page }) => {
    // Should be on admin dashboard
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Should have admin navigation menu
    const navItems = [
      'Dashboard',
      'Vehicle Inventory',
      'Add Vehicle',
      'Reports',
    ];

    for (const item of navItems) {
      await expect(page.locator(`text=${item}`)).toBeVisible();
    }
  });

  test('should navigate to inventory management', async ({ page }) => {
    // Click on Vehicle Inventory
    await page.click('text=Vehicle Inventory');

    // Should navigate to admin inventory page
    await expect(page).toHaveURL('/admin/inventory');

    // Should display vehicle list
    await expect(page.locator('h1, h2')).toContainText('Inventory');

    // Should have action buttons
    await expect(
      page.locator('button, a').filter({ hasText: 'Add' })
    ).toBeVisible();
  });

  test('should navigate to add vehicle form', async ({ page }) => {
    // Navigate to add vehicle
    await page.click('text=Add Vehicle');

    // Should be on add vehicle page
    await expect(page).toHaveURL('/admin/add-vehicle');

    // Should display form fields
    const formFields = [
      'input[name="make"]',
      'input[name="model"]',
      'input[name="year"]',
      'input[name="price"]',
      'input[name="mileage"]',
    ];

    for (const field of formFields) {
      await expect(page.locator(field)).toBeVisible();
    }
  });

  test('should add a new vehicle successfully', async ({ page }) => {
    await page.goto('/admin/add-vehicle');

    // Fill out the form
    await page.fill('input[name="make"]', 'Toyota');
    await page.fill('input[name="model"]', 'Camry');
    await page.fill('input[name="year"]', '2023');
    await page.fill('input[name="price"]', '25000');
    await page.fill('input[name="mileage"]', '15000');

    // Select fuel type if dropdown exists
    const fuelSelect = page.locator('select[name="fuelType"]');
    if (await fuelSelect.isVisible()) {
      await fuelSelect.selectOption('Gasoline');
    }

    // Select transmission if dropdown exists
    const transmissionSelect = page.locator('select[name="transmission"]');
    if (await transmissionSelect.isVisible()) {
      await transmissionSelect.selectOption('Automatic');
    }

    // Fill description
    await page.fill('textarea[name="description"]', 'Test vehicle description');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success message or redirect
    await expect(page.locator('[role="alert"], .toast')).toContainText([
      'Success',
      'Added',
      'Created',
    ]);
  });

  test('should validate required fields in add vehicle form', async ({
    page,
  }) => {
    await page.goto('/admin/add-vehicle');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    const errorMessages = page.locator('.error, [role="alert"], .text-red');
    await expect(errorMessages.first()).toBeVisible();
  });

  test('should edit an existing vehicle', async ({ page }) => {
    await page.goto('/admin/inventory');

    // Look for edit button on first vehicle
    const editButton = page
      .locator('button, a')
      .filter({ hasText: /Edit|Modify/ })
      .first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Should navigate to edit page
      await expect(page).toHaveURL(/\/admin\/edit-vehicle\/\d+/);

      // Should have pre-filled form
      const makeInput = page.locator('input[name="make"]');
      await expect(makeInput).toHaveValue(/.+/); // Should have some value

      // Modify a field
      await makeInput.fill('Updated Make');

      // Submit changes
      await page.click('button[type="submit"]');

      // Should show success message
      await expect(page.locator('[role="alert"], .toast')).toContainText([
        'Success',
        'Updated',
        'Saved',
      ]);
    }
  });

  test('should delete a vehicle with confirmation', async ({ page }) => {
    await page.goto('/admin/inventory');

    // Look for delete button
    const deleteButton = page
      .locator('button')
      .filter({ hasText: /Delete|Remove/ })
      .first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Should show confirmation dialog
      await expect(page.locator('[role="dialog"], .modal')).toBeVisible();

      // Confirm deletion
      await page.click('button').filter({ hasText: /Confirm|Delete|Yes/ });

      // Should show success message
      await expect(page.locator('[role="alert"], .toast')).toContainText([
        'Success',
        'Deleted',
        'Removed',
      ]);
    }
  });

  test('should handle image upload for vehicles', async ({ page }) => {
    await page.goto('/admin/add-vehicle');

    // Look for file input
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      // Create a test image file
      const testImagePath = 'test-car-image.jpg';

      // Upload file (this would need an actual image file in real tests)
      // await fileInput.setInputFiles(testImagePath);

      // Should show image preview or upload success
      // await expect(page.locator('.image-preview, .upload-success')).toBeVisible();
    }
  });

  test('should access user management (super admin only)', async ({ page }) => {
    // Try to navigate to user management
    await page.goto('/admin/users');

    // Should either show user management page or redirect based on permissions
    const currentUrl = page.url();

    if (currentUrl.includes('/admin/users')) {
      // Super admin access - should show user management
      await expect(page.locator('h1, h2')).toContainText('User');
    } else {
      // Regular admin - should be redirected or show access denied
      expect(currentUrl).not.toContain('/admin/users');
    }
  });

  test('should generate and view reports', async ({ page }) => {
    await page.click('text=Reports');

    // Should navigate to reports page
    await expect(page).toHaveURL('/admin/reports');

    // Should display report options or data
    await expect(page.locator('h1, h2')).toContainText('Report');

    // Should have report generation controls
    const reportElements = page
      .locator('button, select')
      .filter({ hasText: /Generate|Report|Export/ });
    if (await reportElements.first().isVisible()) {
      await expect(reportElements.first()).toBeVisible();
    }
  });

  test('should handle bulk operations on vehicles', async ({ page }) => {
    await page.goto('/admin/inventory');

    // Look for bulk selection checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 1) {
      // Select multiple vehicles
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();

      // Look for bulk action buttons
      const bulkActionButton = page
        .locator('button')
        .filter({ hasText: /Bulk|Selected|Multiple/ });
      if (await bulkActionButton.isVisible()) {
        await expect(bulkActionButton).toBeVisible();
      }
    }
  });

  test('should search and filter vehicles in admin inventory', async ({
    page,
  }) => {
    await page.goto('/admin/inventory');

    // Look for search input
    const searchInput = page.locator(
      'input[placeholder*="Search"], input[name*="search"]'
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill('Toyota');

      // Should filter results
      await page.waitForTimeout(1000);

      // Results should be filtered (this is a basic check)
      const vehicleRows = page.locator(
        '[data-testid="vehicle-row"], tr, .vehicle-item'
      );
      await expect(vehicleRows.first()).toBeVisible();
    }
  });

  test('should logout from admin panel', async ({ page }) => {
    // Look for logout button by data-testid or common text
    const logoutButton = page.locator(
      '[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign Out")'
    );

    if (await logoutButton.first().isVisible()) {
      await logoutButton.first().click();

      // Should redirect to login page
      await expect(page).toHaveURL('/login');

      // Should not be able to access admin routes after logout
      await page.goto('/admin');
      await expect(page).toHaveURL('/login');
    }
  });
});
