import { test, expect } from "./fixtures";

test.describe("Issue Comments", () => {
  test("shows comment section on issue detail page", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Comment test issue" });
    await page.goto(`/issues/${issue.id}`);

    await expect(page.getByRole("heading", { name: "Comments" })).toBeVisible();
    await expect(page.getByText("No comments yet")).toBeVisible();
  });

  test("adds a comment to an issue", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Add comment test" });
    await page.goto(`/issues/${issue.id}`);

    // Type in the composer
    const composer = page.locator(".tiptap").last();
    await composer.click();
    await composer.pressSequentially("This is a test comment", { delay: 20 });

    // Click the Comment button
    await page.getByRole("button", { name: "Comment" }).click();

    // Verify the comment appears
    await expect(page.getByText("This is a test comment")).toBeVisible();
    // Empty state should be gone
    await expect(page.getByText("No comments yet")).not.toBeVisible();
  });

  test("edits a comment", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Edit comment test" });
    await api.createComment(issue.id, "<p>Original comment</p>");
    await page.goto(`/issues/${issue.id}`);

    // Wait for comment to load
    await expect(page.getByText("Original comment")).toBeVisible();

    // Click edit button (hover to reveal)
    const commentItem = page.locator("[class*='group']").filter({ hasText: "Original comment" });
    await commentItem.hover();
    await commentItem.getByRole("button").first().click();

    // Clear and type new content
    const editor = commentItem.locator(".tiptap");
    await editor.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("Updated comment");

    // Save (use page-level locator since comment text changed and commentItem filter no longer matches)
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Updated comment")).toBeVisible();
  });

  test("deletes a comment", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Delete comment test" });
    await api.createComment(issue.id, "<p>Comment to delete</p>");
    await page.goto(`/issues/${issue.id}`);

    await expect(page.getByText("Comment to delete")).toBeVisible();

    // Hover and click delete
    const commentItem = page.locator("[class*='group']").filter({ hasText: "Comment to delete" });
    await commentItem.hover();
    // Delete is the second button (after edit)
    await commentItem.getByRole("button").nth(1).click();

    // Comment should be removed
    await expect(page.getByText("Comment to delete")).not.toBeVisible();
    // Should show empty state or toast
    await expect(page.getByText("No comments yet")).toBeVisible();
  });

  test("shows comment count in issue list", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Comment count test" });
    await api.createComment(issue.id, "<p>Comment 1</p>");
    await api.createComment(issue.id, "<p>Comment 2</p>");

    await page.goto("/issues");

    // Find the issue row and check for comment count
    const row = page.locator(`[data-issue-id="${issue.id}"]`);
    await expect(row).toBeVisible();
    await expect(row.getByText("2")).toBeVisible();
  });
});
