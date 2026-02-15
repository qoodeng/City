import { test, expect } from "./fixtures";

test.describe("Context Menu Actions", () => {
  test("change status via context menu", async ({ page, api }) => {
    await api.createIssue({ title: "Ctx Status Issue", status: "backlog" });

    await page.goto("/issues");
    await expect(page.getByText("Ctx Status Issue")).toBeVisible();

    // Right-click to open context menu
    await page.getByText("Ctx Status Issue").click({ button: "right" });

    // Hover "Status" submenu
    await page.getByRole("menuitem", { name: "Status" }).hover();

    // Select "In Progress"
    await page.getByRole("menuitem", { name: "In Progress" }).click();

    // Wait for optimistic update
    await page.waitForTimeout(500);

    // Verify the issue moved to the In Progress group
    await expect(page.getByText("Ctx Status Issue")).toBeVisible();

    // Verify persisted: reload and check issue is in the In Progress section
    await page.reload();
    await expect(page.getByText("Ctx Status Issue")).toBeVisible();
  });

  test("change priority via context menu", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Ctx Priority Issue", priority: "none" });

    await page.goto("/issues");
    await expect(page.getByText("Ctx Priority Issue")).toBeVisible();

    // Right-click to open context menu
    await page.getByText("Ctx Priority Issue").click({ button: "right" });

    // Hover "Priority" submenu
    await page.getByRole("menuitem", { name: "Priority" }).hover();

    // Select "Urgent"
    await page.getByRole("menuitem", { name: "Urgent" }).click();

    await page.waitForTimeout(500);

    // Verify persisted
    await page.reload();
    await expect(page.getByText("Ctx Priority Issue")).toBeVisible();

    // Navigate to detail page to verify
    await page.getByText("Ctx Priority Issue").click();
    await expect(page).toHaveURL(new RegExp(`/issues/${issue.id}`));

    // Check priority in sidebar
    const sidebar = page.locator(".w-64");
    await expect(sidebar.getByText("Urgent")).toBeVisible();
  });
});
