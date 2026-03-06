import { test, expect } from "@playwright/test";

test.describe("App smoke tests", () => {
  test("app loads and shows dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });

  test("nav sidebar shows expected items for ops user", async ({ page }) => {
    await page.goto("/");
    // Wait for the nav to render with canvas page items
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Clusters" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Pods" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Namespaces" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Nodes" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Alerts" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Navigation" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Composer" })).toBeVisible();
  });

  test("canvas page renders plugin module", async ({ page }) => {
    await page.goto("/pods");
    // PodList renders a table with aria-label "Pod list"
    await expect(page.getByRole("grid", { name: "Pod list" })).toBeVisible({
      timeout: 15_000,
    });
    // Table should have at least one data row
    const rows = page
      .getByRole("grid", { name: "Pod list" })
      .locator("tbody tr");
    await expect(rows.first()).toBeVisible();
  });
});
