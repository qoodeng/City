import { test, expect } from "./fixtures";

test.describe("Issue Detail", () => {
  test("detail page loads without errors", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Detail Load Test" });

    await page.goto(`/issues/${issue.id}`);
    await expect(page.getByText(`City-${issue.number}`)).toBeVisible();
    await expect(page.getByText("Detail Load Test")).toBeVisible();
  });

  test("title is displayed and inline-editable", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Editable Title Test" });

    await page.goto(`/issues/${issue.id}`);
    const titleEl = page.getByRole("heading", { name: "Editable Title Test" });
    await expect(titleEl).toBeVisible();

    // Click to enter edit mode
    await titleEl.click();

    // Input should appear with the title value
    const titleInput = page.locator("input[class*='text-xl']");
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveValue("Editable Title Test");

    // Edit the title
    await titleInput.fill("Updated Title Test");
    await titleInput.press("Enter");

    // Title should update
    await expect(page.getByRole("heading", { name: "Updated Title Test" })).toBeVisible();
  });

  test("rich text editor renders", async ({ page, api }) => {
    const issue = await api.createIssue({
      title: "Editor Render Test",
      description: "<p>Test description content</p>",
    });

    await page.goto(`/issues/${issue.id}`);
    await expect(page.getByText("Editor Render Test")).toBeVisible();

    // Wait for the dynamically loaded TipTap editor (first = description editor)
    const editor = page.locator(".tiptap, .ProseMirror").first();
    await expect(editor).toBeVisible({ timeout: 10000 });
  });

  test("change status via property sidebar", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Status Change Test", status: "backlog" });

    await page.goto(`/issues/${issue.id}`);

    const sidebar = page.locator(".w-64");
    await expect(sidebar.getByText("Status", { exact: true })).toBeVisible();

    const statusPicker = sidebar.getByRole("button", { name: /Backlog/ });
    await statusPicker.click();

    const popover = page.locator("[data-radix-popper-content-wrapper]");
    await popover.locator("[cmdk-item]").filter({ hasText: "In Progress" }).click();

    await expect(sidebar.getByRole("button", { name: /In Progress/ })).toBeVisible();
  });

  test("change priority via property sidebar", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Priority Change Test", priority: "none" });

    await page.goto(`/issues/${issue.id}`);

    const sidebar = page.locator(".w-64");
    await expect(sidebar.getByText("Priority", { exact: true })).toBeVisible();

    const priorityPicker = sidebar.getByRole("button", { name: /No Priority/ });
    await priorityPicker.click();

    const popover = page.locator("[data-radix-popper-content-wrapper]");
    await popover.locator("[cmdk-item]").filter({ hasText: "High" }).click();

    await expect(sidebar.getByRole("button", { name: /High/ })).toBeVisible();
  });

  test("assign and change project", async ({ page, api }) => {
    await api.createProject({ name: "Detail Proj XYZ" });
    const issue = await api.createIssue({ title: "Project Assign Test" });

    await page.goto(`/issues/${issue.id}`);

    const sidebar = page.locator(".w-64");
    await expect(sidebar.getByText("Project", { exact: true })).toBeVisible();

    const projectPicker = sidebar.getByRole("button", { name: /No project/ });
    await projectPicker.click();

    const popover = page.locator("[data-radix-popper-content-wrapper]");
    await popover.locator("[cmdk-item]").filter({ hasText: "Detail Proj XYZ" }).click();

    await expect(sidebar.getByRole("button", { name: /Detail Proj XYZ/ })).toBeVisible();
  });

  test("add labels", async ({ page, api }) => {
    await api.createLabel({ name: "UniqueDetailLbl" });
    const issue = await api.createIssue({ title: "Label Test Issue" });

    await page.goto(`/issues/${issue.id}`);

    const sidebar = page.locator(".w-64");
    await expect(sidebar.getByText("Labels", { exact: true })).toBeVisible();

    const labelPicker = sidebar.getByRole("button", { name: /Add labels/ });
    await labelPicker.click();

    const popover = page.locator("[data-radix-popper-content-wrapper]");
    await popover.locator("[cmdk-item]").filter({ hasText: "UniqueDetailLbl" }).click();

    // Close the popover
    await page.keyboard.press("Escape");

    await expect(sidebar.getByRole("button", { name: /1 label/ })).toBeVisible();
  });

  test("metadata dates are displayed", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Metadata Display Test" });

    await page.goto(`/issues/${issue.id}`);

    const sidebar = page.locator(".w-64");
    await expect(sidebar.getByText(/Created/)).toBeVisible();
    await expect(sidebar.getByText(/Updated/)).toBeVisible();
  });

  test("back button returns to issue list", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Back Button Test" });

    await page.goto(`/issues/${issue.id}`);
    await expect(page.getByText("Back Button Test")).toBeVisible();

    await page.locator("a[href='/issues']").first().click();

    await expect(page.getByRole("heading", { name: "All Issues" })).toBeVisible();
  });

  test("sub-issue creation and display", async ({ page, api }) => {
    const parent = await api.createIssue({ title: "Parent Issue For Subs" });
    await api.createIssue({
      title: "Child Issue",
      parentId: parent.id,
    });

    await page.goto(`/issues/${parent.id}`);
    await expect(page.getByText("Parent Issue For Subs")).toBeVisible();

    await expect(page.getByText("Sub-Issues")).toBeVisible();
    await expect(page.getByText("Child Issue")).toBeVisible();

    await expect(page.getByRole("button", { name: /Add sub-issue/ })).toBeVisible();
  });
});
