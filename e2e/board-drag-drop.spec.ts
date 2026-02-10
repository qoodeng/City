import { test, expect } from "./fixtures";

test.describe("Board View", () => {
  test("board shows correct issue counts per column", async ({ page, api }) => {
    await api.createIssue({ title: "Board Count Backlog 1", status: "backlog" });
    await api.createIssue({ title: "Board Count Backlog 2", status: "backlog" });
    await api.createIssue({ title: "Board Count Todo 1", status: "todo" });
    await api.createIssue({ title: "Board Count Done 1", status: "done" });

    await page.goto("/issues");
    await page.keyboard.press("2");
    await page.waitForTimeout(1500);

    const columns = page.locator(".w-72");

    // Backlog column header should show count >= 2
    const backlogCount = columns.nth(0).locator(".text-xs.text-muted-foreground.ml-auto");
    const backlogText = await backlogCount.textContent();
    expect(Number(backlogText)).toBeGreaterThanOrEqual(2);

    // Todo column should show >= 1
    const todoCount = columns.nth(1).locator(".text-xs.text-muted-foreground.ml-auto");
    const todoText = await todoCount.textContent();
    expect(Number(todoText)).toBeGreaterThanOrEqual(1);

    // Done column should show >= 1
    const doneCount = columns.nth(3).locator(".text-xs.text-muted-foreground.ml-auto");
    const doneText = await doneCount.textContent();
    expect(Number(doneText)).toBeGreaterThanOrEqual(1);
  });

  test("cards appear in correct columns by status", async ({ page, api }) => {
    const backlogIssue = await api.createIssue({ title: "Column Test Backlog", status: "backlog" });
    const todoIssue = await api.createIssue({ title: "Column Test Todo", status: "todo" });
    const inProgressIssue = await api.createIssue({ title: "Column Test InProg", status: "in_progress" });
    const doneIssue = await api.createIssue({ title: "Column Test Done", status: "done" });

    await page.goto("/issues");
    await page.keyboard.press("2");
    await page.waitForTimeout(1500);

    const columns = page.locator(".w-72");

    // Backlog column (0) contains the backlog issue
    await expect(columns.nth(0).locator(`[data-issue-id="${backlogIssue.id}"]`)).toBeVisible();

    // Todo column (1) contains the todo issue
    await expect(columns.nth(1).locator(`[data-issue-id="${todoIssue.id}"]`)).toBeVisible();

    // In Progress column (2) contains the in_progress issue
    await expect(columns.nth(2).locator(`[data-issue-id="${inProgressIssue.id}"]`)).toBeVisible();

    // Done column (3) contains the done issue
    await expect(columns.nth(3).locator(`[data-issue-id="${doneIssue.id}"]`)).toBeVisible();
  });

  test("clicking a board card navigates to issue detail", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Board Click Issue", status: "todo" });

    await page.goto("/issues");
    await page.keyboard.press("2");
    await page.waitForTimeout(1500);

    // Click the card
    const card = page.locator(`[data-issue-id="${issue.id}"]`);
    await expect(card).toBeVisible();
    await card.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(new RegExp(`/issues/${issue.id}`));
    await expect(page.getByRole("heading", { name: "Board Click Issue" })).toBeVisible();
  });

  test("issue moved via API reflects in board after reload", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Board Reflect Issue", status: "backlog" });

    await page.goto("/issues");
    await page.keyboard.press("2");
    await page.waitForTimeout(1500);

    // Verify in backlog column
    const columns = page.locator(".w-72");
    await expect(columns.nth(0).locator(`[data-issue-id="${issue.id}"]`)).toBeVisible();

    // Update status via API
    await api.updateIssue(issue.id, { status: "done" });

    // Reload and verify it moved to done column
    await page.reload();
    await page.keyboard.press("2");
    await page.waitForTimeout(1500);

    const reloadedColumns = page.locator(".w-72");
    await expect(reloadedColumns.nth(3).locator(`[data-issue-id="${issue.id}"]`)).toBeVisible();
  });

  test("board cards show issue metadata", async ({ page, api }) => {
    const label = await api.createLabel({ name: "BoardLabel" });
    const issue = await api.createIssue({
      title: "Board Meta Issue",
      status: "todo",
      priority: "high",
      assignee: "Chris",
      labelIds: [label.id],
    });

    await page.goto("/issues");
    await page.keyboard.press("2");
    await page.waitForTimeout(1500);

    const card = page.locator(`[data-issue-id="${issue.id}"]`);
    await expect(card).toBeVisible();

    // Card shows the title
    await expect(card.getByText("Board Meta Issue")).toBeVisible();

    // Card shows the label
    await expect(card.getByText("BoardLabel")).toBeVisible();

    // Card shows assignee avatar (the bg-city-yellow/20 circle)
    await expect(card.locator(".bg-city-yellow\\/20")).toBeVisible();

    // Card shows issue number
    await expect(card.getByText(`City-${issue.number}`)).toBeVisible();
  });
});
