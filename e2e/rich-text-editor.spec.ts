import { test, expect } from "./fixtures";

test.describe("Rich Text Editor", () => {
  test("type and save description", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "RTE Description Issue" });

    await page.goto(`/issues/${issue.id}`);
    await expect(page.getByText("RTE Description Issue")).toBeVisible();

    // Wait for TipTap editor to load
    const editor = page.locator(".tiptap").first();
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Click into the editor and type
    await editor.click();
    await editor.pressSequentially("This is a test description", { delay: 20 });

    // Blur to trigger save
    await page.locator("h1").click();
    await page.waitForTimeout(1000);

    // Reload and verify content persisted
    await page.reload();
    const editorAfterReload = page.locator(".tiptap").first();
    await expect(editorAfterReload).toBeVisible({ timeout: 10000 });
    await expect(editorAfterReload).toContainText("This is a test description");
  });

  test("bold text with keyboard shortcut", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "RTE Bold Issue" });

    await page.goto(`/issues/${issue.id}`);
    const editor = page.locator(".tiptap").first();
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Type text, select it, bold it
    await editor.click();
    await editor.pressSequentially("bold text", { delay: 20 });

    // Select all text in editor
    await page.keyboard.press("Meta+a");

    // Apply bold
    await page.keyboard.press("Meta+b");

    // Blur to save
    await page.locator("h1").click();
    await page.waitForTimeout(1000);

    // Verify bold is rendered (strong tag in the HTML)
    await expect(editor.locator("strong")).toContainText("bold text");
  });

  test("italic text with keyboard shortcut", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "RTE Italic Issue" });

    await page.goto(`/issues/${issue.id}`);
    const editor = page.locator(".tiptap").first();
    await expect(editor).toBeVisible({ timeout: 10000 });

    await editor.click();
    await editor.pressSequentially("italic text", { delay: 20 });

    // Select all
    await page.keyboard.press("Meta+a");
    // Apply italic
    await page.keyboard.press("Meta+i");

    // Verify italic is rendered
    await expect(editor.locator("em")).toContainText("italic text");
  });

  test("bullet list with markdown shortcut", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "RTE List Issue" });

    await page.goto(`/issues/${issue.id}`);
    const editor = page.locator(".tiptap").first();
    await expect(editor).toBeVisible({ timeout: 10000 });

    // TipTap StarterKit supports markdown shortcuts: "- " for bullet list
    await editor.click();
    await page.keyboard.type("- First item", { delay: 20 });
    await page.keyboard.press("Enter");
    await page.keyboard.type("Second item", { delay: 20 });

    // Verify list is rendered
    await expect(editor.locator("ul")).toBeVisible();
    await expect(editor.locator("li").first()).toContainText("First item");
    await expect(editor.locator("li").nth(1)).toContainText("Second item");
  });

  test("heading with markdown shortcut", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "RTE Heading Issue" });

    await page.goto(`/issues/${issue.id}`);
    const editor = page.locator(".tiptap").first();
    await expect(editor).toBeVisible({ timeout: 10000 });

    // TipTap StarterKit: "# " creates an h1
    await editor.click();
    await page.keyboard.type("# My Heading", { delay: 20 });

    // Verify heading is rendered
    await expect(editor.locator("h1")).toContainText("My Heading");
  });

  test("code block with markdown shortcut", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "RTE Code Issue" });

    await page.goto(`/issues/${issue.id}`);
    const editor = page.locator(".tiptap").first();
    await expect(editor).toBeVisible({ timeout: 10000 });

    // TipTap StarterKit: "```" + space creates a code block
    await editor.click();
    await page.keyboard.type("```", { delay: 20 });
    await page.keyboard.press("Space");
    await page.keyboard.type("const x = 42;", { delay: 20 });

    // Verify code block rendered
    await expect(editor.locator("pre")).toBeVisible();
    await expect(editor.locator("pre")).toContainText("const x = 42;");
  });

  test("description persists after editing", async ({ page, api }) => {
    const issue = await api.createIssue({
      title: "RTE Persist Issue",
      description: "<p>Original description</p>",
    });

    await page.goto(`/issues/${issue.id}`);
    const editor = page.locator(".tiptap").first();
    await expect(editor).toBeVisible({ timeout: 10000 });
    await expect(editor).toContainText("Original description");

    // Clear and type new content
    await editor.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("Updated description", { delay: 20 });

    // Blur to save
    await page.locator("h1").click();
    await page.waitForTimeout(1000);

    // Reload to verify
    await page.reload();
    const editorAfterReload = page.locator(".tiptap").first();
    await expect(editorAfterReload).toBeVisible({ timeout: 10000 });
    await expect(editorAfterReload).toContainText("Updated description");
  });
});
