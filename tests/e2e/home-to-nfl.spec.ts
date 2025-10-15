import { test, expect } from "@playwright/test";

test("home → nfl nav", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await page.getByRole("link", { name: "NFL" }).click();
  await expect(page).toHaveURL(/\/nfl$/);
});

test("nfl hero visible on homepage", async ({ page }) => {
  await page.goto("http://localhost:3000/");
  await expect(page.getByText("NFL Props")).toBeVisible();
  await expect(page.getByRole("link", { name: /Explore NFL Props/i })).toBeVisible();
});
