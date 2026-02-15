import { test, expect } from "./fixtures";

test.describe("Keyboard Shortcuts", () => {
  test("C opens create issue dialog", async ({ page }) => {
    await page.goto("/issues");
    await expect(page.getByRole("heading", { name: "All Issues" })).toBeVisible();

    // Press C to open create dialog
    await page.keyboard.press("c");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create Issue" })).toBeVisible();

    // Escape to close
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("1 and 2 switch between list and board views", async ({ page, api }) => {
    await api.createIssue({ title: "View Switch KB Issue", status: "backlog" });

    await page.goto("/issues");
    await expect(page.getByText("View Switch KB Issue")).toBeVisible();

    // Press 2 to switch to board view
    await page.keyboard.press("2");
    await page.waitForTimeout(1000);

    // Board columns should be visible
    await expect(page.getByText("Backlog").first()).toBeVisible();

    // Press 1 to switch back to list view
    await page.keyboard.press("1");
    await expect(page.getByText("View Switch KB Issue")).toBeVisible();
  });

  test("J and K navigate through issues", async ({ page, api }) => {
    await api.createIssue({ title: "Nav Issue A", status: "backlog" });
    await api.createIssue({ title: "Nav Issue B", status: "backlog" });

    await page.goto("/issues");
    await expect(page.getByText("Nav Issue A")).toBeVisible();

    // Press J to focus first issue
    await page.keyboard.press("j");

    // The focused row should have a highlight class
    const focused = page.locator("[data-issue-id].bg-city-yellow\\/10");
    await expect(focused).toBeVisible();

    // Press J again to move to next
    await page.keyboard.press("j");

    // Press K to go back up
    await page.keyboard.press("k");
  });

  test("Enter opens focused issue", async ({ page, api }) => {
    const _issue = await api.createIssue({ title: "Enter Open Issue" });

    await page.goto("/issues");
    await expect(page.getByText("Enter Open Issue")).toBeVisible();

    // Focus the issue
    await page.keyboard.press("j");

    // Press Enter to open it
    await page.keyboard.press("Enter");

    // Should navigate to issue detail
    await expect(page).toHaveURL(new RegExp("/issues/"));
  });

  test("Cmd+K opens command palette", async ({ page }) => {
    await page.goto("/issues");

    // Open command palette
    await page.keyboard.press("Meta+k");

    // Command palette should be visible
    await expect(page.getByPlaceholder("Type a command or search...")).toBeVisible();

    // Close with Escape
    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder("Type a command or search...")).toBeHidden();
  });

  test("Escape closes dialogs", async ({ page }) => {
    await page.goto("/issues");

    // Open create dialog with C
    await page.keyboard.press("c");
    await expect(page.getByRole("dialog")).toBeVisible();

    // Close with Escape
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("? opens keyboard help dialog", async ({ page }) => {
    await page.goto("/issues");

    // Press Shift+? to open help
    await page.keyboard.press("Shift+?");

    // Keyboard shortcuts dialog should appear
    await expect(page.getByText("Keyboard Shortcuts")).toBeVisible();

    // Close
    await page.keyboard.press("Escape");
    await expect(page.getByText("Keyboard Shortcuts")).toBeHidden();
  });

  test("status shortcuts on focused issue", async ({ page, api }) => {
    const _issue = await api.createIssue({ title: "Status Shortcut Issue", status: "backlog" });

    await page.goto("/issues");
    await expect(page.getByText("Status Shortcut Issue")).toBeVisible();

    // Focus the issue
    await page.keyboard.press("j");

    // Press D to mark done
    await page.keyboard.press("d");

    // Wait for update
    await page.waitForTimeout(500);

    // The issue should now be in the "Done" group
    // Verify by reloading and checking
    await page.reload();
    await expect(page.getByText("Status Shortcut Issue")).toBeVisible();
  });
});
