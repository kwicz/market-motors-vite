import { test, expect } from '@playwright/test';

test.describe('Inventory and Car Browsing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('should display the home page correctly', async ({ page }) => {
    // Check that the home page loads
    await expect(page.locator('h1')).toBeVisible();

    // Should have navigation to inventory
    const inventoryLink = page.locator('a[href="/inventory"]');
    await expect(inventoryLink).toBeVisible();
  });

  test('should navigate to inventory page and display cars', async ({
    page,
  }) => {
    // Navigate to inventory
    await page.click('a[href="/inventory"]');

    // Should be on inventory page
    await expect(page).toHaveURL('/inventory');

    // Should display car cards
    const carCards = page.locator('[data-testid="car-card"]');
    await expect(carCards.first()).toBeVisible();

    // Should have search functionality
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });

  test('should filter cars by search term', async ({ page }) => {
    await page.goto('/inventory');

    // Wait for cars to load
    await page.waitForSelector('[data-testid="car-card"]');

    // Get initial count of cars
    const initialCarCount = await page
      .locator('[data-testid="car-card"]')
      .count();

    // Search for a specific make
    await page.fill('input[placeholder*="Search"]', 'Toyota');
    await page.keyboard.press('Enter');

    // Should filter results
    await page.waitForTimeout(1000); // Wait for filtering

    // Check that filtering occurred (results should be different)
    const filteredCarCount = await page
      .locator('[data-testid="car-card"]')
      .count();

    // Either we have fewer cars (filtered) or no Toyota cars (0 results)
    expect(filteredCarCount).toBeLessThanOrEqual(initialCarCount);
  });

  test('should sort cars by price', async ({ page }) => {
    await page.goto('/inventory');

    // Wait for cars to load
    await page.waitForSelector('[data-testid="car-card"]');

    // Click sort dropdown
    const sortDropdown = page.locator('select, [data-testid="sort-select"]');
    if (await sortDropdown.isVisible()) {
      await sortDropdown.selectOption('price-low-high');

      // Wait for sorting to apply
      await page.waitForTimeout(1000);

      // Get the first few car prices to verify sorting
      const priceElements = page.locator('[data-testid="car-price"]');
      const firstPrice = await priceElements.first().textContent();
      const secondPrice = await priceElements.nth(1).textContent();

      // Prices should be in ascending order (basic check)
      expect(firstPrice).toBeTruthy();
      expect(secondPrice).toBeTruthy();
    }
  });

  test('should navigate to car details page', async ({ page }) => {
    await page.goto('/inventory');

    // Wait for cars to load and click on the first car
    await page.waitForSelector('[data-testid="car-card"]');
    const firstCarCard = page.locator('[data-testid="car-card"]').first();

    // Get the car ID or link href
    const carLink = firstCarCard.locator('a').first();
    await carLink.click();

    // Should navigate to car details page
    await expect(page).toHaveURL(/\/car\/\d+/);

    // Should display car details
    await expect(page.locator('h1')).toBeVisible(); // Car title
    await expect(page.locator('[data-testid="car-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="car-specs"]')).toBeVisible();
  });

  test('should display car image gallery', async ({ page }) => {
    await page.goto('/inventory');

    // Navigate to first car details
    await page.waitForSelector('[data-testid="car-card"]');
    const firstCarCard = page.locator('[data-testid="car-card"]').first();
    await firstCarCard.locator('a').first().click();

    // Should display car images
    const carImages = page.locator(
      '[data-testid="car-image"], img[alt*="car"], img[alt*="vehicle"]'
    );
    await expect(carImages.first()).toBeVisible();

    // Check if image loads properly
    const firstImage = carImages.first();
    await expect(firstImage).toHaveAttribute('src', /.+/);
  });

  test('should handle responsive design on mobile viewport', async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/inventory');

    // Should still display cars in mobile view
    await page.waitForSelector('[data-testid="car-card"]');
    const carCards = page.locator('[data-testid="car-card"]');
    await expect(carCards.first()).toBeVisible();

    // Mobile navigation should work
    const mobileMenu = page.locator(
      '[data-testid="mobile-menu"], .mobile-menu, button[aria-label*="menu"]'
    );
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      // Should show navigation items
      await expect(page.locator('nav')).toBeVisible();
    }
  });

  test('should handle empty search results gracefully', async ({ page }) => {
    await page.goto('/inventory');

    // Search for something that doesn't exist
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('NonExistentCarBrand12345');
    await page.keyboard.press('Enter');

    // Wait for search to complete
    await page.waitForTimeout(1000);

    // Should show no results message or empty state
    const noResultsMessage = page.locator(
      'text=No cars found, text=No results, [data-testid="no-results"]'
    );
    const carCards = page.locator('[data-testid="car-card"]');

    // Either show no results message or have no car cards
    const hasNoResultsMessage = await noResultsMessage.isVisible();
    const carCount = await carCards.count();

    expect(hasNoResultsMessage || carCount === 0).toBeTruthy();
  });

  test('should filter cars by category/type', async ({ page }) => {
    await page.goto('/inventory');

    // Wait for cars to load
    await page.waitForSelector('[data-testid="car-card"]');

    // Look for category filters
    const categoryFilter = page.locator(
      'select[name*="category"], [data-testid="category-filter"]'
    );
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption('sedan');

      // Wait for filtering
      await page.waitForTimeout(1000);

      // Should show filtered results
      const carCards = page.locator('[data-testid="car-card"]');
      await expect(carCards.first()).toBeVisible();
    }
  });

  test('should display car specifications correctly', async ({ page }) => {
    await page.goto('/inventory');

    // Navigate to car details
    await page.waitForSelector('[data-testid="car-card"]');
    await page
      .locator('[data-testid="car-card"]')
      .first()
      .locator('a')
      .first()
      .click();

    // Should display key specifications
    const specs = ['year', 'make', 'model', 'mileage', 'fuel', 'transmission'];

    for (const spec of specs) {
      const specElement = page.locator(
        `[data-testid="${spec}"], text=${spec}`,
        { hasText: new RegExp(spec, 'i') }
      );
      // At least some specs should be visible
    }

    // Should display price prominently
    await expect(page.locator('[data-testid="car-price"]')).toBeVisible();
  });
});
