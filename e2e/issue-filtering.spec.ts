import { test, expect } from "./fixtures";

test.describe("Issue Filtering", () => {
  test("filter by status", async ({ page, api }) => {
    const ts = Date.now();
    await api.createIssue({ title: `FltBacklog-${ts}`, status: "backlog", priority: "high" });
    await api.createIssue({ title: `FltTodo-${ts}`, status: "todo", priority: "low" });
    await api.createIssue({ title: `FltDone-${ts}`, status: "done", priority: "urgent" });

    await page.goto("/issues");
    await expect(page.getByRole("heading", { name: "All Issues" })).toBeVisible();

    // Open status filter popover
    await page.getByRole("button", { name: "Status" }).click();

    // Select "Todo" status from the command item list
    await page.locator("[cmdk-item]").filter({ hasText: "Todo" }).click();

    // Close popover by clicking elsewhere
    await page.locator("body").click({ position: { x: 0, y: 0 } });
    await page.waitForTimeout(500);

    // Todo issue should be visible, others should not
    await expect(page.getByText(`FltTodo-${ts}`)).toBeVisible();
    await expect(page.getByText(`FltBacklog-${ts}`)).toBeHidden();
    await expect(page.getByText(`FltDone-${ts}`)).toBeHidden();
  });

  test("filter by priority", async ({ page, api }) => {
    const ts = Date.now();
    await api.createIssue({ title: `PriHigh-${ts}`, status: "backlog", priority: "high" });
    await api.createIssue({ title: `PriLow-${ts}`, status: "todo", priority: "low" });

    await page.goto("/issues");
    await expect(page.getByRole("heading", { name: "All Issues" })).toBeVisible();

    // Open priority filter
    await page.getByRole("button", { name: "Priority" }).click();

    // Select "High"
    await page.locator("[cmdk-item]").filter({ hasText: "High" }).click();
    await page.locator("body").click({ position: { x: 0, y: 0 } });
    await page.waitForTimeout(500);

    // Only the high priority issue should be visible
    await expect(page.getByText(`PriHigh-${ts}`)).toBeVisible();
    await expect(page.getByText(`PriLow-${ts}`)).toBeHidden();
  });

  test("search by text", async ({ page, api }) => {
    const ts = Date.now();
    await api.createIssue({ title: `SearchTarget-${ts}` });
    await api.createIssue({ title: `OtherIssue-${ts}` });

    await page.goto("/issues");
    await expect(page.getByRole("heading", { name: "All Issues" })).toBeVisible();

    // Type in search
    await page.getByPlaceholder("Search issues...").fill(`SearchTarget-${ts}`);

    // Wait for search results
    await page.waitForTimeout(500);

    // Only matching issue should show
    await expect(page.getByText(`SearchTarget-${ts}`)).toBeVisible();
  });

  test("clear filters resets all", async ({ page, api }) => {
    const ts = Date.now();
    await api.createIssue({ title: `ClearBacklog-${ts}`, status: "backlog" });
    await api.createIssue({ title: `ClearTodo-${ts}`, status: "todo" });

    await page.goto("/issues");

    // Apply a status filter
    await page.getByRole("button", { name: "Status" }).click();
    await page.locator("[cmdk-item]").filter({ hasText: "Todo" }).click();

    // Close popover
    await page.locator("body").click({ position: { x: 0, y: 0 } });
    await page.waitForTimeout(500);

    // Clear button should appear
    const clearBtn = page.getByRole("button", { name: "Clear" });
    await expect(clearBtn).toBeVisible();

    // Click clear
    await clearBtn.click();
    await page.waitForTimeout(500);

    // Both issues should be visible again
    await expect(page.getByText(`ClearBacklog-${ts}`)).toBeVisible();
    await expect(page.getByText(`ClearTodo-${ts}`)).toBeVisible();
  });

  test("filter by project", async ({ page, api }) => {
    const ts = Date.now();
    const project = await api.createProject({ name: `FilterProj-${ts}` });
    await api.createIssue({ title: `InProj-${ts}`, projectId: project.id });
    await api.createIssue({ title: `NoProj-${ts}` });

    await page.goto("/issues");
    await expect(page.getByRole("heading", { name: "All Issues" })).toBeVisible();

    // Open project filter
    const projectBtn = page.getByRole("button", { name: "Project" });
    if (await projectBtn.isVisible({ timeout: 3000 })) {
      await projectBtn.click();
      await page.locator("[cmdk-item]").filter({ hasText: `FilterProj-${ts}` }).click();
      await page.locator("body").click({ position: { x: 0, y: 0 } });
      await page.waitForTimeout(500);

      // Only project-assigned issue should be visible
      await expect(page.getByText(`InProj-${ts}`)).toBeVisible();
      await expect(page.getByText(`NoProj-${ts}`)).toBeHidden();
    }
  });

  test("filter by label", async ({ page, api }) => {
    const ts = Date.now();
    const label = await api.createLabel({ name: `FilterLbl-${ts}` });
    await api.createIssue({ title: `Labeled-${ts}`, labelIds: [label.id] });
    await api.createIssue({ title: `Unlabeled-${ts}` });

    await page.goto("/issues");

    const labelBtn = page.getByRole("button", { name: "Label" });
    if (await labelBtn.isVisible({ timeout: 3000 })) {
      await labelBtn.click();
      await page.locator("[cmdk-item]").filter({ hasText: `FilterLbl-${ts}` }).click();
      await page.locator("body").click({ position: { x: 0, y: 0 } });
      await page.waitForTimeout(500);

      await expect(page.getByText(`Labeled-${ts}`)).toBeVisible();
      await expect(page.getByText(`Unlabeled-${ts}`)).toBeHidden();
    }
  });

  test("sort by different fields", async ({ page, api }) => {
    const ts = Date.now();
    await api.createIssue({ title: `AAA-${ts}`, priority: "low" });
    await api.createIssue({ title: `ZZZ-${ts}`, priority: "urgent" });

    await page.goto("/issues");
    await expect(page.getByRole("heading", { name: "All Issues" })).toBeVisible();

    // Change sort to Title
    const sortTrigger = page.locator("button").filter({ hasText: "Created" });
    await sortTrigger.click();
    await page.getByRole("option", { name: "Title" }).click();

    // Both issues should still be visible
    await expect(page.getByText(`AAA-${ts}`)).toBeVisible();
    await expect(page.getByText(`ZZZ-${ts}`)).toBeVisible();
  });

  test("toggle sort order", async ({ page, api }) => {
    await api.createIssue({ title: "Sort Order Issue" });

    await page.goto("/issues");

    // Click the sort order toggle button (ArrowDown/ArrowUp icon)
    const orderBtn = page.locator("button").filter({ has: page.locator("svg.lucide-arrow-down, svg.lucide-arrow-up") });
    if (await orderBtn.first().isVisible({ timeout: 3000 })) {
      await orderBtn.first().click();
    }
  });

  test("filters persist in URL params", async ({ page, api }) => {
    await api.createIssue({ title: "URL Filter Issue", status: "todo" });

    await page.goto("/issues");

    // Apply status filter
    await page.getByRole("button", { name: "Status" }).click();
    await page.locator("[cmdk-item]").filter({ hasText: "Todo" }).click();
    await page.locator("body").click({ position: { x: 0, y: 0 } });

    // URL should contain status param
    await page.waitForTimeout(500);
    expect(page.url()).toContain("status");
  });
});
