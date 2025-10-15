import { test, expect } from "@playwright/test";

test("/nfl never blank", async ({ page }) => {
  await page.goto("http://localhost:3000/nfl");
  // Either skeletons, error, empty, or cards — but page should have something visible
  const main = page.locator("main");
  await expect(main).toBeVisible();
  
  // Should have either props grid or error/empty state
  const hasContent = await page.locator("main").evaluate((el) => {
    return el.textContent && el.textContent.trim().length > 0;
  });
  expect(hasContent).toBeTruthy();
});

test("nfl page has proper structure", async ({ page }) => {
  await page.goto("http://localhost:3000/nfl");
  
  // Check for title
  await expect(page.getByRole("heading", { name: /NFL Props/i })).toBeVisible();
});
