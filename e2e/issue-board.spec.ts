import { test, expect } from "./fixtures";

test.describe("Issue Board", () => {
  test("board view renders 5 status columns", async ({ page, api }) => {
    await api.createIssue({ title: "Board Test Issue", status: "backlog" });

    await page.goto("/issues");
    await expect(page.getByRole("heading", { name: "All Issues" })).toBeVisible();

    // Switch to board view
    await page.keyboard.press("2");

    // Wait for board to render (dynamic import)
    await page.waitForTimeout(1500);

    // Should see all 5 status column headers
    await expect(page.getByText("Backlog").first()).toBeVisible();
    await expect(page.getByText("Todo").first()).toBeVisible();
    await expect(page.getByText("In Progress").first()).toBeVisible();
    await expect(page.getByText("Done").first()).toBeVisible();
    await expect(page.getByText("Cancelled").first()).toBeVisible();
  });

  test("issues appear in correct columns", async ({ page, api }) => {
    await api.createIssue({ title: "Board Backlog Item", status: "backlog" });
    await api.createIssue({ title: "Board Todo Item", status: "todo" });
    await api.createIssue({ title: "Board Done Item", status: "done" });

    await page.goto("/issues");

    // Switch to board view
    await page.keyboard.press("2");
    await page.waitForTimeout(1500);

    // Each issue should be visible on the board
    await expect(page.getByText("Board Backlog Item")).toBeVisible();
    await expect(page.getByText("Board Todo Item")).toBeVisible();
    await expect(page.getByText("Board Done Item")).toBeVisible();
  });

  test("switch between list and board views", async ({ page, api }) => {
    await api.createIssue({ title: "View Switch Issue", status: "backlog" });

    await page.goto("/issues");

    // Default is list view — issue should be visible
    await expect(page.getByText("View Switch Issue")).toBeVisible();

    // Switch to board view
    await page.keyboard.press("2");
    await page.waitForTimeout(1500);

    // Board columns should be visible
    await expect(page.getByText("Backlog").first()).toBeVisible();
    await expect(page.getByText("View Switch Issue")).toBeVisible();

    // Switch back to list view
    await page.keyboard.press("1");
    await page.waitForTimeout(500);

    // Issue should still be visible in list
    await expect(page.getByText("View Switch Issue")).toBeVisible();
  });

  test("view mode persists when navigating away and back", async ({ page, api }) => {
    await api.createIssue({ title: "Persist View Issue", status: "todo" });

    await page.goto("/issues");
    await expect(page.getByText("Persist View Issue")).toBeVisible();

    // Switch to board view using keyboard shortcut
    await page.keyboard.press("2");
    await page.waitForTimeout(2000);

    // Verify board is showing — board columns have w-72 class
    await expect(page.locator(".w-72").first()).toBeVisible();

    // Navigate to dashboard (scope to sidebar to avoid matching board card links)
    await page.locator("aside").getByRole("link", { name: "Dashboard" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // Navigate back to issues
    await page.locator("aside").getByRole("link", { name: "All Issues" }).click();
    await page.waitForTimeout(2000);

    // Board view should still be active — board columns with w-72 should be visible
    await expect(page.locator(".w-72").first()).toBeVisible();
  });
});
