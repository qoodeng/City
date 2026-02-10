import { test, expect } from "./fixtures";
import path from "path";
import fs from "fs";
import os from "os";

test.describe("Attachments", () => {
  let tempFile: string;

  test.beforeEach(async () => {
    // Create a temporary test file
    tempFile = path.join(os.tmpdir(), `test-attachment-${Date.now()}.txt`);
    fs.writeFileSync(tempFile, "This is a test attachment file content.");
  });

  test.afterEach(async () => {
    // Clean up temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  });

  test("upload file to issue and see it in attachments", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Attachment Upload Issue" });

    await page.goto(`/issues/${issue.id}`);
    await expect(page.getByText("Attachment Upload Issue")).toBeVisible();

    // Find the Attachments heading
    await expect(page.getByRole("heading", { name: "Attachments" })).toBeVisible();
    await expect(page.getByText("No attachments")).toBeVisible();

    // Upload a file via the hidden file input
    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles(tempFile);

    // Wait for upload
    await page.waitForTimeout(2000);

    // Verify the attachment appears
    const filename = path.basename(tempFile);
    await expect(page.getByText(filename)).toBeVisible();

    // "No attachments" should be gone
    await expect(page.getByText("No attachments")).toBeHidden();
  });

  test("delete attachment from issue", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Attachment Delete Issue" });

    await page.goto(`/issues/${issue.id}`);
    await expect(page.getByText("Attachment Delete Issue")).toBeVisible();

    // Upload a file first
    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles(tempFile);
    await page.waitForTimeout(2000);

    const filename = path.basename(tempFile);
    await expect(page.getByText(filename)).toBeVisible();

    // Hover over the attachment to reveal delete button, then click it
    const attachmentRow = page.locator(".group").filter({ hasText: filename });
    await attachmentRow.hover();

    // The X button is the delete button in the hover group
    const deleteBtn = attachmentRow.locator("button");
    await deleteBtn.click();

    // Verify toast
    await expect(page.getByText("Attachment removed")).toBeVisible();

    // Verify attachment is gone
    await page.waitForTimeout(500);
    await expect(page.getByText("No attachments")).toBeVisible();
  });

  test("attachment persists after page reload", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Attachment Persist Issue" });

    await page.goto(`/issues/${issue.id}`);
    await expect(page.getByText("Attachment Persist Issue")).toBeVisible();

    // Upload a file
    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles(tempFile);
    await page.waitForTimeout(2000);

    const filename = path.basename(tempFile);
    await expect(page.getByText(filename)).toBeVisible();

    // Reload and verify
    await page.reload();
    await expect(page.getByText(filename)).toBeVisible({ timeout: 10000 });
  });
});
