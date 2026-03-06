import { test, expect, Page } from "@playwright/test";
import { resetOpsUser, updateNavLayout, getNavLayout } from "../helpers/api";

const OPS_USER_ID = "ops-user";

/**
 * Select a specific cluster from the ClusterSwitcher dropdown.
 * The default scope is "All Clusters" — many plugin pages (like
 * DeploymentDetailsPage) require a single-cluster scope.
 */
async function selectCluster(page: Page, clusterName: string) {
  const toggle = page.getByRole("button", {
    name: /All Clusters|Production|Staging|Development|DR/,
  });
  await toggle.click();
  await page.getByRole("option", { name: clusterName }).click();
  // Wait for single-cluster mode — the "Cluster" column header disappears
  await expect(page.getByRole("columnheader", { name: "Cluster" })).toBeHidden({
    timeout: 15_000,
  });
}

/**
 * Open the kebab menu on the first pod row and click an action.
 */
async function clickPodKebabAction(page: Page, actionName: string) {
  // Wait for the pod table to load
  const table = page.getByRole("grid", { name: "Pod list" });
  await expect(table).toBeVisible({ timeout: 15_000 });

  // Click the kebab toggle on the first row
  const firstRow = table.locator("tbody tr").first();
  const kebab = firstRow.getByRole("button", { name: "Kebab toggle" });
  await kebab.click();

  // Click the specified action
  await page.getByRole("menuitem", { name: actionName }).click();
}

test.describe.serial("Routing plugin — cross-module navigation", () => {
  test.beforeEach(async () => {
    await resetOpsUser();
  });

  test("Pod kebab → 'View Deployment' navigates correctly", async ({
    page,
  }) => {
    await page.goto("/pods");

    // Scope to a single cluster so the navigation target can render
    await selectCluster(page, "US East Production");

    // Wait for pod data to reload after scope change
    const table = page.getByRole("grid", { name: "Pod list" });
    await expect(table).toBeVisible({ timeout: 15_000 });

    // Get the namespace from the first row (3rd column: Name, Namespace, Status…)
    const firstRow = table.locator("tbody tr").first();
    const nsCell = firstRow.locator("td").nth(1); // no Cluster column in single-cluster mode
    const namespace = await nsCell.textContent();

    await clickPodKebabAction(page, "View Deployment");

    // Should navigate to /deployment-details?namespace=<ns>
    await expect(page).toHaveURL(
      new RegExp(`/deployment-details\\?namespace=${namespace}`),
    );
  });

  test("Pod kebab → 'Deployment Metrics' navigates with sub-path", async ({
    page,
  }) => {
    await page.goto("/pods");
    await selectCluster(page, "US East Production");

    const table = page.getByRole("grid", { name: "Pod list" });
    await expect(table).toBeVisible({ timeout: 15_000 });

    const firstRow = table.locator("tbody tr").first();
    const nsCell = firstRow.locator("td").nth(1);
    const namespace = await nsCell.textContent();

    await clickPodKebabAction(page, "Deployment Metrics");

    await expect(page).toHaveURL(
      new RegExp(`/deployment-details/metrics\\?namespace=${namespace}`),
    );
  });

  test("navigation works for page not in nav layout", async ({ page }) => {
    // Remove deployment-details from nav layout but keep the page
    const { navLayout } = await getNavLayout(OPS_USER_ID);
    const withoutDeployDetails = navLayout.filter(
      (entry) =>
        !(entry.type === "page" && entry.pageId === "seed-deployment-details"),
    );
    await updateNavLayout(OPS_USER_ID, withoutDeployDetails);

    await page.goto("/pods");
    await selectCluster(page, "US East Production");

    const table = page.getByRole("grid", { name: "Pod list" });
    await expect(table).toBeVisible({ timeout: 15_000 });

    const firstRow = table.locator("tbody tr").first();
    const nsCell = firstRow.locator("td").nth(1);
    const namespace = await nsCell.textContent();

    // Actions should still work — getPluginPagePath falls back to not-in-nav pages
    await clickPodKebabAction(page, "View Deployment");

    await expect(page).toHaveURL(
      new RegExp(`/deployment-details\\?namespace=${namespace}`),
    );
  });

  test("kebab actions disabled when target page is fully removed", async ({
    page,
  }) => {
    // Delete the deployment-details page via the Composer UI so React state
    // updates in-place (API-only deletion doesn't propagate to the SPA).
    await page.goto("/pages");
    await expect(page.getByRole("heading", { name: "Composer" })).toBeVisible();
    // Find the card containing "/deployment-details" and open its kebab
    const deployCard = page
      .locator(".fs-page-card")
      .filter({ hasText: "/deployment-details" });
    await deployCard.getByRole("button", { name: "Page actions" }).click();
    await page.getByRole("menuitem", { name: "Delete page" }).click();
    // Verify it's gone from the list
    await expect(deployCard).toBeHidden();

    // Navigate to Pods — kebab should be disabled
    await page.getByRole("link", { name: "Pods" }).click();
    await selectCluster(page, "US East Production");

    const table = page.getByRole("grid", { name: "Pod list" });
    await expect(table).toBeVisible({ timeout: 15_000 });

    // The kebab toggle itself should be disabled (actionsDisabled = true)
    const firstRow = table.locator("tbody tr").first();
    const kebab = firstRow.getByRole("button", { name: "Kebab toggle" });
    await expect(kebab).toBeDisabled();
  });
});
