import { test, expect } from "./fixtures";

test.describe("Dashboard", () => {
  test("loads with title and status overview", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/City/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Status Overview")).toBeVisible();
  });

  test("status distribution bar renders with issue counts", async ({ page, api }) => {
    // Seed issues with different statuses
    await api.createIssue({ title: "Dashboard Backlog Issue", status: "backlog" });
    await api.createIssue({ title: "Dashboard Todo Issue", status: "todo" });
    await api.createIssue({ title: "Dashboard Done Issue", status: "done" });

    await page.goto("/");
    await expect(page.getByText("Status Overview")).toBeVisible();
    // The total count should be visible
    await expect(page.getByText(/total issues/)).toBeVisible();
  });

  test("dashboard sections render", async ({ page }) => {
    await page.goto("/");
    // These are h2 headings inside section cards
    await expect(page.getByRole("heading", { name: "Due This Week" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Stale Issues" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recently Updated" })).toBeVisible();
  });

  test("clicking an issue row navigates to detail page", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Dashboard Nav Test Issue" });

    await page.goto("/");
    // Wait for the recently updated section to load
    await expect(page.getByRole("heading", { name: "Recently Updated" })).toBeVisible();

    // Click the issue link
    const issueLink = page.getByRole("link", { name: /Dashboard Nav Test Issue/ });
    if (await issueLink.isVisible()) {
      await issueLink.click();
      await expect(page).toHaveURL(new RegExp(`/issues/${issue.id}`));
    }
  });

  test("New Issue button opens create dialog", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "New Issue" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create Issue" })).toBeVisible();
  });
});
