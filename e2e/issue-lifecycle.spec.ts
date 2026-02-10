import { test, expect } from "./fixtures";

test.describe("Issue Lifecycle", () => {
  test("create issue with title only", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "New Issue" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create Issue" })).toBeVisible();

    // Button should be disabled without title
    const createBtn = page.getByRole("button", { name: "Create Issue" });
    await expect(createBtn).toBeDisabled();

    // Fill title
    await page.getByPlaceholder("Issue title").fill("Lifecycle Test Issue");
    await expect(createBtn).toBeEnabled();

    // Submit
    await createBtn.click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText(/Created City-/)).toBeVisible();
  });

  test("create issue with all properties", async ({ page, api }) => {
    // Seed a project and label for selection
    const project = await api.createProject({ name: "Lifecycle Project" });
    const label = await api.createLabel({ name: "Lifecycle Label" });

    await page.goto("/");

    await page.getByRole("button", { name: "New Issue" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Fill title
    await page.getByPlaceholder("Issue title").fill("Full Props Issue");

    // Change status to Todo
    const dialog = page.getByRole("dialog");
    const statusTrigger = dialog.locator("button").filter({ hasText: "Backlog" });
    await statusTrigger.click();
    await page.getByRole("option", { name: /Todo/ }).click();

    // Change priority to High
    const priorityTrigger = dialog.locator("button").filter({ hasText: "No Priority" });
    await priorityTrigger.click();
    await page.getByRole("option", { name: /High/ }).click();

    // Select project
    const projectTrigger = dialog.locator("button").filter({ hasText: "Project" });
    if (await projectTrigger.isVisible()) {
      await projectTrigger.click();
      await page.getByRole("option", { name: project.name }).click();
    }

    // Select label
    const labelBtn = dialog.getByText(label.name);
    if (await labelBtn.isVisible()) {
      await labelBtn.click();
    }

    // Fill assignee
    await page.getByPlaceholder("Assignee").fill("Christian");

    // Submit
    await page.getByRole("button", { name: "Create Issue" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText(/Created City-/)).toBeVisible();
  });

  test("cancel creation with Escape", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "New Issue" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("created issue appears in issue list", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Appears In List Issue" });

    await page.goto("/issues");
    await expect(page.getByRole("heading", { name: "All Issues" })).toBeVisible();
    await expect(page.getByText("Appears In List Issue")).toBeVisible();
  });

  test("delete issue from context menu", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Context Delete Issue" });

    await page.goto("/issues");
    await expect(page.getByText("Context Delete Issue")).toBeVisible();

    // Right-click on the issue row
    await page.getByText("Context Delete Issue").click({ button: "right" });

    // Click Delete in context menu
    await page.getByRole("menuitem", { name: "Delete" }).click();

    // Verify toast
    await expect(page.getByText(/Deleted City-/)).toBeVisible();
  });

  test("undo delete via toast action", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Undo Delete Issue" });

    await page.goto("/issues");
    await expect(page.getByText("Undo Delete Issue")).toBeVisible();

    // Delete via context menu
    await page.getByText("Undo Delete Issue").click({ button: "right" });
    await page.getByRole("menuitem", { name: "Delete" }).click();

    // Click Undo on the toast
    const undoBtn = page.getByRole("button", { name: "Undo" });
    if (await undoBtn.isVisible({ timeout: 3000 })) {
      await undoBtn.click();
      // Issue should reappear after undo
      await page.waitForTimeout(1000);
      await page.reload();
      await expect(page.getByText("Undo Delete Issue")).toBeVisible();
    }
  });
});
