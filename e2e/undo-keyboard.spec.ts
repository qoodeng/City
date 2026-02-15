import { test, expect } from "./fixtures";

test.describe("Undo via Cmd+Z", () => {
  test("undo status change with Cmd+Z", async ({ page, api }) => {
    const _issue = await api.createIssue({ title: "Undo Status Issue", status: "backlog" });

    await page.goto("/issues");
    await expect(page.getByText("Undo Status Issue")).toBeVisible();

    // Focus the issue and change status to done
    await page.keyboard.press("j");
    await page.keyboard.press("d"); // d = mark done

    await page.waitForTimeout(500);

    // Undo with Cmd+Z
    await page.keyboard.press("Meta+z");
    await page.waitForTimeout(1000);

    // Verify the issue is back to backlog - reload to confirm
    await page.reload();
    await page.getByText("Undo Status Issue").click();
    const sidebar = page.locator(".w-64");
    await expect(sidebar.getByText("Backlog")).toBeVisible();
  });

  test("undo delete with Cmd+Z", async ({ page, api }) => {
    const _issue = await api.createIssue({ title: "Undo Delete Kbd Issue" });

    await page.goto("/issues");
    await expect(page.getByText("Undo Delete Kbd Issue")).toBeVisible();

    // Delete via context menu
    await page.getByText("Undo Delete Kbd Issue").click({ button: "right" });
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(page.getByText(/Deleted City-/)).toBeVisible();

    // Wait for deletion to register
    await page.waitForTimeout(500);

    // Undo with Cmd+Z
    await page.keyboard.press("Meta+z");
    await page.waitForTimeout(1000);

    // Verify the issue is restored
    await page.reload();
    await expect(page.getByText("Undo Delete Kbd Issue")).toBeVisible();
  });

  test("undo priority change with Cmd+Z", async ({ page, api }) => {
    const _issue = await api.createIssue({ title: "Undo Priority Issue", priority: "none" });

    await page.goto("/issues");
    await expect(page.getByText("Undo Priority Issue")).toBeVisible();

    // Navigate to detail page and change priority
    await page.getByText("Undo Priority Issue").click();
    await expect(page).toHaveURL(new RegExp(`/issues/${issue.id}`));

    const sidebar = page.locator(".w-64");
    const priorityPicker = sidebar.getByRole("button", { name: /No Priority/ });
    await priorityPicker.click();

    const popover = page.locator("[data-radix-popper-content-wrapper]");
    await popover.locator("[cmdk-item]").filter({ hasText: "High" }).click();

    await page.waitForTimeout(500);
    await expect(sidebar.getByText("High")).toBeVisible();

    // Undo with Cmd+Z
    await page.keyboard.press("Meta+z");
    await page.waitForTimeout(1000);

    // Verify reverted
    await page.reload();
    await expect(sidebar.getByText("No Priority")).toBeVisible();
  });
});
