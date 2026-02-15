import { test, expect } from "./fixtures";

test.describe("Inline Picker (Keyboard-Triggered)", () => {
  test("s key opens inline status picker and changes status", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Inline Status Issue", status: "todo" });

    // Filter to isolate the issue
    await page.goto(`/issues?search=${encodeURIComponent(issue.title)}`);
    await expect(page.getByText("Inline Status Issue")).toBeVisible();

    // Press j to focus the only issue
    await page.keyboard.press("j");
    const focusedRow = page.locator(`[data-issue-id="${issue.id}"].bg-city-yellow\\/10`);
    await expect(focusedRow).toBeVisible();

    // Press s to open status picker
    await page.keyboard.press("s");

    const picker = page.locator(".fixed.z-50.w-56");
    await expect(picker).toBeVisible();

    // Type to filter then press Enter (avoids viewport overflow issues with positioned picker)
    const searchInput = picker.getByPlaceholder("Set status...");
    await searchInput.fill("todo");
    await page.waitForTimeout(300);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1000);

    // Verify via API
    const res = await page.request.get(`/api/issues/${issue.id}`);
    const data = await res.json();
    expect(data.status).toBe("todo");
  });

  test("p key opens inline priority picker and changes priority", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Inline Priority Issue", priority: "none" });

    // Filter to isolate the issue
    await page.goto(`/issues?search=${encodeURIComponent(issue.title)}`);
    await expect(page.getByText("Inline Priority Issue")).toBeVisible();

    // Press j to focus
    await page.keyboard.press("j");
    const focusedRow = page.locator(`[data-issue-id="${issue.id}"].bg-city-yellow\\/10`);
    await expect(focusedRow).toBeVisible();

    // Press p to open priority picker
    await page.keyboard.press("p");

    const picker = page.locator(".fixed.z-50.w-56");
    await expect(picker).toBeVisible();

    // Type to filter then press Enter
    const searchInput = picker.getByPlaceholder("Set priority...");
    await searchInput.fill("urgent");
    await page.waitForTimeout(300);
    await page.keyboard.press("Enter");

    await page.waitForTimeout(1000);

    // Verify via API
    const res = await page.request.get(`/api/issues/${issue.id}`);
    const data = await res.json();
    expect(data.priority).toBe("urgent");
  });

  test("l key opens inline label picker and toggles label", async ({ page, api }) => {
    const label = await api.createLabel({ name: "InlineTestLabel" });
    const issue = await api.createIssue({ title: "Inline Label Issue" });

    // Filter to isolate the issue
    await page.goto(`/issues?search=${encodeURIComponent(issue.title)}`);
    await expect(page.getByText("Inline Label Issue")).toBeVisible();

    // Press j to focus
    await page.keyboard.press("j");
    const focusedRow = page.locator(`[data-issue-id="${issue.id}"].bg-city-yellow\\/10`);
    await expect(focusedRow).toBeVisible();

    // Press l to open label picker
    await page.keyboard.press("l");

    const picker = page.locator(".fixed.z-50.w-56");
    await expect(picker).toBeVisible();

    // Type to filter then press Enter
    const searchInput = picker.getByPlaceholder("Toggle label...");
    await searchInput.fill("InlineTestLabel");
    await page.waitForTimeout(300);
    await page.keyboard.press("Enter");

    await page.waitForTimeout(1000);

    // Verify via API
    const res = await page.request.get(`/api/issues/${issue.id}`);
    const data = await res.json();
    expect(data.labels.some((l: { name: string }) => l.name === "InlineTestLabel")).toBe(true);
  });

  test("Escape closes inline picker without changes", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Escape Picker Issue" });

    await page.goto("/issues");
    await expect(page.getByText("Escape Picker Issue")).toBeVisible();

    // Focus any issue
    await page.keyboard.press("j");

    // Open status picker
    await page.keyboard.press("s");

    const picker = page.locator(".fixed.z-50.w-56");
    await expect(picker).toBeVisible();

    // Press Escape to close
    await page.keyboard.press("Escape");
    await expect(picker).toBeHidden();
  });
});
