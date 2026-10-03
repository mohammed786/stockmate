import { test, expect } from "@playwright/test";

test.describe("StockMate App", () => {
  test("dashboard loads", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("stock page loads", async ({ page }) => {
    await page.goto("/stock");
    await expect(page.locator("h1")).toContainText("Stock");
  });

  test("purchases page loads", async ({ page }) => {
    await page.goto("/purchases");
    await expect(page.locator("h1")).toContainText("Purchases");
  });

  test("sales page loads", async ({ page }) => {
    await page.goto("/sales");
    await expect(page.locator("h1")).toContainText("Sales");
  });

  test("reports page loads", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.locator("h1")).toContainText("Reports");
  });

  test("can navigate to new purchase", async ({ page }) => {
    await page.goto("/purchases");
    await page.click('a[href="/purchases/new"]');
    await expect(page.locator("h1")).toContainText("New Purchase");
  });

  test("can navigate to new sale", async ({ page }) => {
    await page.goto("/sales");
    await page.click('a[href="/sales/new"]');
    await expect(page.locator("h1")).toContainText("New Sale");
  });
});