const { test, expect } = require('@playwright/test');
const { DEFAULT_PAGE_WAIT_TIME } = require('./constants');
const { setupErrorTracking, logCapturedErrors, pageHasContent, pageLoadComplete, mainContentIsVisible } = require('./helpers');

/**
 * Integration tests for Upstream Pulse module
 *
 * These tests verify:
 * - Module loads and renders correctly
 * - Data fetching and display works
 * - Navigation within the module functions
 * - API integration is functional
 *
 * Note: Unlike unit tests, these tests do NOT mock API responses at the
 * browser level. All requests flow through to the Express backend running
 * in demo mode, which exercises the getDemoData() stubs in server/index.js.
 *
 * Tag: @upstream-pulse
 * Usage: npx playwright test --grep @upstream-pulse
 */

test.describe('Upstream Pulse Module @upstream-pulse', () => {
  test.beforeEach(async ({ page }) => {
    setupErrorTracking(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    logCapturedErrors(page, testInfo);
  });

  test('should be visible in sidebar navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    // Find the Upstream Pulse module in the sidebar
    const moduleNav = page.locator('aside nav').filter({ hasText: 'Upstream Pulse' });
    const count = await moduleNav.count();
    expect(count).toBeGreaterThan(0);

    // Verify the module link is visible and clickable
    const moduleLink = moduleNav.first();
    await expect(moduleLink).toBeVisible();

    expect(page.errors).toHaveLength(0);
  });

  test('module header should be disabled', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    const moduleHeader = page.locator('aside nav button').filter({ hasText: 'Upstream Pulse' }).first();
    const isDisabled = await moduleHeader.getAttribute('disabled');
    expect(isDisabled).not.toBeNull();

    const cursor = await moduleHeader.evaluate(el => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('not-allowed');

    expect(page.errors).toHaveLength(0);
  });

  test('should fetch data from Upstream Pulse API endpoints', async ({ page }) => {
    // Monitor network requests
    const apiRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/modules/upstream-pulse')) {
        apiRequests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });

    // Navigate to Dashboard view (makes API calls for metrics)
    await page.goto('/#/upstream-pulse/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    // Verify that API requests were made to the Upstream Pulse endpoints
    // The dashboard should make calls to /dashboard, /contributors, /leadership, etc.
    // In demo mode, the backend's getDemoData() returns stub responses
    expect(apiRequests.length).toBeGreaterThan(0);
    console.log(`Upstream Pulse API requests: ${apiRequests.length}`);
    apiRequests.forEach(req => {
      console.log(`  ${req.method} ${req.url}`);
    });

    // Verify at least one request is for the dashboard endpoint (the default view)
    const dashboardRequest = apiRequests.find(req => req.url.includes('/dashboard'));
    expect(dashboardRequest).toBeDefined();

    expect(page.errors).toHaveLength(0);
  });

});

/**
 * Module is disabled for OSAC — verify the header is grayed out.
 * Individual nav item tests removed since the module cannot be expanded.
 */

/**
 * Active Components
 *
 * Verify each major view (aka menu item) in the Upstream Pulse module loads with
 * meaningful content. These tests exercise the demo mode backend, ensuring that
 * the getDemoData() stubs return valid responses that render without errors.
 */
test.describe('Upstream Pulse Views @upstream-pulse', () => {
  test.beforeEach(async ({ page }) => {
    setupErrorTracking(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    logCapturedErrors(page, testInfo);
  });

  // Helper to navigate and verify a view loads with content
  async function testView(page, viewId, viewName) {
    await page.goto(`/#/upstream-pulse/${viewId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    // Before we verify content, we need to verify the overall view loads
    const mainContentVisible = await mainContentIsVisible(page);
    expect(mainContentVisible).toBe(true);

    // Verify the view has rendered some meaningful content by checking for
    // data-bearing elements (not just empty containers or placeholders)
    const hasContent = await pageHasContent(page);
    expect(hasContent).toBe(true);

    // Verify we're not stuck in an infinite loading state
    const pageHasFinishedLoading = await pageLoadComplete(page);
    expect(pageHasFinishedLoading).toBe(true);
    if (page.errors.length > 0) {
      console.error(`${viewName} errors:`, page.errors);
    }

    expect(page.errors).toHaveLength(0);
  }

  test('should load Dashboard view', async ({ page }) => {
    await testView(page, 'dashboard', 'Dashboard');
  });

  test('should load Insights view', async ({ page }) => {
    await testView(page, 'insights', 'Insights');
  });

  test('should load Portfolio view', async ({ page }) => {
    await testView(page, 'portfolio', 'Portfolio');
  });

  test('should load Strategy view', async ({ page }) => {
    await testView(page, 'strategy', 'Strategy');
  });
});
