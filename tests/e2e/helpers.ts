import { expect, Locator } from '@playwright/test';

export const selectors = {
  edgesListItem: 'ul >> [data-testid="edge-row"]',
  drawer: '[data-testid="evidence-drawer"]',
  video: 'video',
};

export async function expectInViewport(el: Locator) {
  const box = await el.boundingBox();
  expect(box).not.toBeNull();
  const vp = await el.page().viewportSize();
  expect(vp).toBeTruthy();
  if (box && vp) {
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 1); // allow 1px tolerance
  }
}
