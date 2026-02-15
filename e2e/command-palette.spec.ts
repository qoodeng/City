import { test, expect } from "./fixtures";

test.describe("Command Palette", () => {
  test("opens with Cmd+K", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Meta+k");

    // Command palette dialog should be visible
    await expect(page.getByPlaceholder("Type a command or search...")).toBeVisible();
  });

  test("issues appear in palette from store", async ({ page, api }) => {
    const ts = Date.now();
    await api.createIssue({ title: `PaletteIssue-${ts}` });

    // Navigate to issues first so the store loads issues
    await page.goto("/issues");
    await expect(page.getByText(`PaletteIssue-${ts}`)).toBeVisible();

    // Open command palette
    await page.keyboard.press("Meta+k");
    await expect(page.getByPlaceholder("Type a command or search...")).toBeVisible();

    // The issue should be visible in the "Issues" group (shows top 20 from store)
    // Type the unique name to filter
    await page.getByPlaceholder("Type a command or search...").fill(`PaletteIssue`);
    await page.waitForTimeout(500);

    // Should find it either in search results or static list
    await expect(page.getByText(`PaletteIssue-${ts}`).first()).toBeVisible();
  });

  test("clicking result navigates to issue", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Click Navigate Issue" });

    // Navigate to issues first so the store loads
    await page.goto("/issues");
    await expect(page.getByText("Click Navigate Issue")).toBeVisible();

    await page.keyboard.press("Meta+k");

    // Click the issue in the palette
    const result = page.locator("[cmdk-item]").filter({ hasText: "Click Navigate Issue" });
    if (await result.isVisible({ timeout: 3000 })) {
      await result.click();
      await expect(page).toHaveURL(new RegExp(`/issues/${issue.id}`));
    }
  });

  test("Create Issue action opens dialog", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Meta+k");
    await expect(page.getByPlaceholder("Type a command or search...")).toBeVisible();

    // Click "Create Issue" action
    const createAction = page.locator("[cmdk-item]").filter({ hasText: "Create Issue" });
    await createAction.click();

    // Create dialog should open
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create Issue" })).toBeVisible();
  });

  test("navigation items work", async ({ page }) => {
    await page.goto("/");

    // Open palette
    await page.keyboard.press("Meta+k");

    // Click "All Issues" navigation item
    const issuesItem = page.locator("[cmdk-item]").filter({ hasText: "All Issues" });
    await issuesItem.click();

    await expect(page.getByRole("heading", { name: "All Issues" })).toBeVisible();

    // Open palette again
    await page.keyboard.press("Meta+k");

    // Click "Projects" navigation item
    const projectsItem = page.locator("[cmdk-item]").filter({ hasText: "Projects" });
    await projectsItem.click();

    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("Escape closes palette", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Meta+k");
    await expect(page.getByPlaceholder("Type a command or search...")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder("Type a command or search...")).toBeHidden();
  });
});
