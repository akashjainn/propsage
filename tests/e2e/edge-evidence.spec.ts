import { test, expect } from '@playwright/test';
import { selectors, expectInViewport } from './helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('Edge → Evidence flow', () => {
  test('opens evidence drawer with clips or fallbacks', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForSelector(selectors.edgesListItem, { timeout: 15000 });
    const firstEdge = page.locator(selectors.edgesListItem).first();
    await expect(firstEdge).toBeVisible();
    await firstEdge.click();
    const drawer = page.locator(selectors.drawer);
    await expect(drawer).toBeVisible();
    await expect(drawer.locator(selectors.video).first()).toBeVisible({ timeout: 10000 });
  });

  test('focused prop is scrolled into view', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForSelector(selectors.edgesListItem, { timeout: 15000 });
    const firstEdge = page.locator(selectors.edgesListItem).first();
    // Derive a crude slug from text (must match normalize logic enough for test)
    const rawText = await firstEdge.textContent();
    await firstEdge.click();
    if (rawText) {
      const slug = rawText
        .toLowerCase()
        .replace(/[^\w\s/+-]+/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
      const target = page.locator(`[data-prop="${slug}"]`).first();
      await expect(target).toBeVisible({ timeout: 10000 });
      await expectInViewport(target);
    }
  });
});

