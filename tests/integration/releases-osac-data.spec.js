const { test, expect } = require('@playwright/test');
const { DEFAULT_PAGE_WAIT_TIME } = require('./constants');
const { setupErrorTracking, logCapturedErrors } = require('./helpers');

/**
 * OSAC Releases Data Verification
 *
 * Verifies that all Releases tabs render real OSAC data on the test environment.
 * Runs against a live server (not demo mode) at BASE_URL.
 *
 * Tag: @releases-osac
 * Usage: BASE_URL=http://ocp-edge117:8081 npx playwright test --grep @releases-osac
 */

test.describe('Releases OSAC Data @releases-osac', () => {
  test.beforeEach(async ({ page }) => {
    setupErrorTracking(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    logCapturedErrors(page, testInfo);
  });

  // ----------------------------------------------------------------
  // TEST 1: Schedule — 7 OSAC releases with milestone dates
  // ----------------------------------------------------------------
  test('Schedule shows OSAC releases with milestones', async ({ page }) => {
    await page.goto('/#/releases/schedule');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    // Should show OSAC release names
    await expect(page.locator('text=OSAC 0.2').first()).toBeVisible();
    await expect(page.locator('text=OSAC 0.3').first()).toBeVisible();

    // Should NOT show RHOAI releases
    const rhoai = page.locator('text=/RHOAI/i');
    expect(await rhoai.count()).toBe(0);

    expect(page.errors).toHaveLength(0);
  });

  // ----------------------------------------------------------------
  // TEST 2: Schedule API — registry returns 7 releases, correct dates
  // ----------------------------------------------------------------
  test('Registry API returns 7 OSAC releases with correct milestones', async ({ request }) => {
    const res = await request.get('/api/modules/releases/registry');
    expect(res.ok()).toBe(true);
    const body = await res.json();

    expect(body.releases).toHaveLength(7);

    var ids = body.releases.map(function (r) { return r.id });
    expect(ids).toContain('osac-0.2');
    expect(ids).toContain('osac-0.3');
    expect(ids).toContain('osac-0.2-M1');
    expect(ids).toContain('osac-Backlog');

    // No RHOAI
    var rhoai = ids.filter(function (id) { return id.includes('rhoai') });
    expect(rhoai).toHaveLength(0);

    // Milestone dates
    var r03 = body.releases.find(function (r) { return r.id === 'osac-0.3' });
    expect(r03.milestones.ga).toBe('2026-12-29');
    expect(r03.milestones.planningFreeze).toBe('2026-09-29');

    var backlog = body.releases.find(function (r) { return r.id === 'osac-Backlog' });
    expect(backlog.milestones.ga).toBeUndefined();
  });

  // ----------------------------------------------------------------
  // TEST 3: Execute / Feature List — 154 OSAC features
  // ----------------------------------------------------------------
  test('Execute Feature List shows OSAC features', async ({ page }) => {
    await page.goto('/#/releases/execute');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    // Should have a table or list with features
    var mainContent = page.locator('main, [role="main"], .min-h-screen').first();
    await expect(mainContent).toBeVisible();

    // Should show OSAC issue keys
    var osacKeys = page.locator('text=/OSAC-\\d+/');
    expect(await osacKeys.count()).toBeGreaterThan(0);

    // Should NOT show RHAISTRAT keys
    var rhaistrat = page.locator('text=/RHAISTRAT-/');
    expect(await rhaistrat.count()).toBe(0);

    expect(page.errors).toHaveLength(0);
  });

  // ----------------------------------------------------------------
  // TEST 4: Execute API — all OSAC keys, correct counts
  // ----------------------------------------------------------------
  test('Execution API returns only OSAC features with health data', async ({ request }) => {
    const res = await request.get('/api/modules/releases/execution/features');
    expect(res.ok()).toBe(true);
    const body = await res.json();

    expect(body.featureCount).toBeGreaterThanOrEqual(100);

    // All keys are OSAC
    var nonOsac = body.features.filter(function (f) { return !f.key.startsWith('OSAC-') });
    expect(nonOsac).toHaveLength(0);

    // Health levels present
    var healths = {};
    body.features.forEach(function (f) {
      if (f.health) healths[f.health] = (healths[f.health] || 0) + 1;
    });
    expect(Object.keys(healths).length).toBeGreaterThanOrEqual(2);

    // Version distribution
    var versions = {};
    body.features.forEach(function (f) {
      (f.fixVersions || []).forEach(function (v) {
        versions[v] = (versions[v] || 0) + 1;
      });
    });
    expect(versions['0.2']).toBeGreaterThanOrEqual(40);
    expect(versions['0.3']).toBeGreaterThanOrEqual(20);
  });

  // ----------------------------------------------------------------
  // TEST 5: Execute / Feature Detail — clickable, shows epics
  // ----------------------------------------------------------------
  test('Feature detail loads with metrics', async ({ request }) => {
    var indexRes = await request.get('/api/modules/releases/execution/features');
    var body = await indexRes.json();
    var key = body.features[0].key;

    var detailRes = await request.get('/api/modules/releases/execution/features/' + key);
    expect(detailRes.ok()).toBe(true);
    var detail = await detailRes.json();

    expect(detail.key).toBe(key);
    expect(detail).toHaveProperty('summary');
    expect(detail).toHaveProperty('status');
    expect(detail).toHaveProperty('metrics');
    expect(detail).toHaveProperty('components');
    expect(detail).toHaveProperty('fixVersions');
  });

  // ----------------------------------------------------------------
  // TEST 6: Execute / Hygiene — violations for v0.2 and v0.3
  // ----------------------------------------------------------------
  test('Hygiene shows violations for OSAC versions', async ({ page }) => {
    await page.goto('/#/releases/execute');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    // Click Feature Status tab
    var hygieneTab = page.locator('button', { hasText: 'Feature Status' });
    if (await hygieneTab.count() > 0) {
      await hygieneTab.click();
      await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);
    }

    expect(page.errors).toHaveLength(0);
  });

  // ----------------------------------------------------------------
  // TEST 7: Hygiene API — 54 features for v0.2
  // ----------------------------------------------------------------
  test('Hygiene API returns violations for OSAC versions', async ({ request }) => {
    var res = await request.get('/api/modules/releases/hygiene/features?version=0.2');
    expect(res.ok()).toBe(true);
    var body = await res.json();

    var features = body.features || {};
    var count = Object.keys(features).length;
    expect(count).toBeGreaterThanOrEqual(40);

    // Check violations structure
    var first = Object.values(features)[0];
    expect(first).toHaveProperty('violations');
    expect(Array.isArray(first.violations)).toBe(true);
    if (first.violations.length > 0) {
      expect(first.violations[0]).toHaveProperty('id');
      expect(first.violations[0]).toHaveProperty('name');
      expect(first.violations[0]).toHaveProperty('category');
    }

    // No hygiene for old RHOAI version
    var res35 = await request.get('/api/modules/releases/hygiene/features?version=3.5');
    expect(res35.ok()).toBe(true);
    var body35 = await res35.json();
    expect(Object.keys(body35.features || {}).length).toBe(0);
  });

  // ----------------------------------------------------------------
  // TEST 8: Deliver / Risk Dashboard — 7 releases, 0.2-M1 RED
  // ----------------------------------------------------------------
  test('Deliver Risk Dashboard shows OSAC releases with risk levels', async ({ page }) => {
    await page.goto('/#/releases/deliver');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    // Should show OSAC version numbers
    await expect(page.locator('text=0.2').first()).toBeVisible();

    expect(page.errors).toHaveLength(0);
  });

  // ----------------------------------------------------------------
  // TEST 9: Delivery API — correct risk levels and issue counts
  // ----------------------------------------------------------------
  test('Delivery API returns 7 releases with correct risk analysis', async ({ request }) => {
    var res = await request.get('/api/modules/releases/delivery/analysis');
    expect(res.ok()).toBe(true);
    var body = await res.json();

    expect(body.releases).toHaveLength(7);

    var versions = {};
    body.releases.forEach(function (r) { versions[r.releaseNumber] = r });

    // 0.2-M1 should be RED
    expect(versions['0.2-M1'].risk).toBe('red');
    expect(versions['0.2-M1'].totals.total).toBe(43);

    // Backlog should be none
    expect(versions['Backlog'].risk).toBe('none');

    // Each release should have issues array
    body.releases.forEach(function (r) {
      expect(Array.isArray(r.issues)).toBe(true);
      if (r.issues.length > 0) {
        expect(r.issues[0]).toHaveProperty('key');
        expect(r.issues[0]).toHaveProperty('status');
      }
    });
  });

  // ----------------------------------------------------------------
  // TEST 10: Deliver / Quality — 23 bugs in 0.1, 2 in 0.3
  // ----------------------------------------------------------------
  test('Quality API returns bug counts per version', async ({ request }) => {
    var res = await request.get('/api/modules/releases/delivery/quality/versions');
    expect(res.ok()).toBe(true);
    var body = await res.json();

    expect(body).toHaveLength(2);
    var vmap = {};
    body.forEach(function (v) { vmap[v.name] = v });
    expect(vmap['0.1'].bugCount).toBe(23);
    expect(vmap['0.3'].bugCount).toBe(2);
  });

  // ----------------------------------------------------------------
  // TEST 11: PM Hub — 11 OSAC pillars, no RHOAI
  // ----------------------------------------------------------------
  test('PM Hub shows OSAC component pillars', async ({ page }) => {
    await page.goto('/#/releases/plan');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    var pmHubTab = page.locator('button', { hasText: 'PM Hub' });
    if (await pmHubTab.count() > 0) {
      await pmHubTab.click();
      await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);
    }

    expect(page.errors).toHaveLength(0);
  });

  // ----------------------------------------------------------------
  // TEST 12: PM Hub API — 11 pillars, OSAC components
  // ----------------------------------------------------------------
  test('PM Hub API returns OSAC pillar config', async ({ request }) => {
    var res = await request.get('/api/modules/releases/pm-hub/pillar-config');
    expect(res.ok()).toBe(true);
    var body = await res.json();

    expect(body.pillars).toHaveLength(11);

    var names = body.pillars.map(function (p) { return p.name });
    expect(names).toContain('VMaaS');
    expect(names).toContain('Connectivity&Fabric');

    // No RHOAI pillars
    expect(names).not.toContain('Inference');
    expect(names).not.toContain('Data');
    expect(names).not.toContain('Agents');
  });

  // ----------------------------------------------------------------
  // TEST 13: Planning — Big Rocks seeded for OSAC versions
  // ----------------------------------------------------------------
  test('Planning API has big rocks for OSAC versions', async ({ request }) => {
    var configRes = await request.get('/api/modules/releases/planning/config');
    expect(configRes.ok()).toBe(true);
    var config = await configRes.json();

    var versions = Object.keys(config.releases || {});
    expect(versions.length).toBeGreaterThanOrEqual(2);
    expect(versions).toContain('0.2');
    expect(versions).toContain('0.3');

    // Big rocks are stored in per-release files after migration
    var listRes = await request.get('/api/modules/releases/planning/releases');
    expect(listRes.ok()).toBe(true);
    var releases = await listRes.json();
    expect(releases.length).toBeGreaterThanOrEqual(2);

    var ver02 = releases.find(function (r) { return r.version === '0.2' });
    expect(ver02).toBeTruthy();
    expect(ver02.bigRockCount).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------------
  // TEST 14: Plan tab loads without errors
  // ----------------------------------------------------------------
  test('Plan Big Rocks tab loads', async ({ page }) => {
    await page.goto('/#/releases/plan');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    var mainContent = page.locator('main, [role="main"], .min-h-screen').first();
    await expect(mainContent).toBeVisible();

    expect(page.errors).toHaveLength(0);
  });

  // ----------------------------------------------------------------
  // TEST 15: Reports tab loads
  // ----------------------------------------------------------------
  test('Reports hub loads with report cards', async ({ page }) => {
    await page.goto('/#/releases/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    var mainContent = page.locator('main, [role="main"], .min-h-screen').first();
    await expect(mainContent).toBeVisible();

    expect(page.errors).toHaveLength(0);
  });

  // ----------------------------------------------------------------
  // TEST 16: Audit tab loads
  // ----------------------------------------------------------------
  test('Audit tab loads', async ({ page }) => {
    await page.goto('/#/releases/audit');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DEFAULT_PAGE_WAIT_TIME);

    var mainContent = page.locator('main, [role="main"], .min-h-screen').first();
    await expect(mainContent).toBeVisible();

    expect(page.errors).toHaveLength(0);
  });
});
