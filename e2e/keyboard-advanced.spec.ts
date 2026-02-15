import { test, expect } from "./fixtures";

test.describe("Advanced Keyboard Shortcuts", () => {
  test("status shortcuts: t (todo), i (in_progress), d (done)", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Kbd Status Issue", status: "backlog" });

    // Filter to isolate the issue
    await page.goto(`/issues?search=${encodeURIComponent(issue.title)}`);
    await expect(page.getByText("Kbd Status Issue")).toBeVisible();

    // Press j to focus
    await page.keyboard.press("j");
    const row = page.locator(`[data-issue-id="${issue.id}"].bg-city-yellow\\/10`);
    await expect(row).toBeVisible();

    // t = mark todo
    await page.keyboard.press("t");
    await page.waitForTimeout(500);

    // i = mark in_progress
    await page.keyboard.press("i");
    await page.waitForTimeout(500);

    // d = mark done
    await page.keyboard.press("d");
    await page.waitForTimeout(500);

    // Verify final state via API
    const res = await page.request.get(`/api/issues/${issue.id}`);
    const data = await res.json();
    expect(data.status).toBe("done");
  });

  test("x marks focused issue as cancelled", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Kbd Cancel Issue", status: "backlog" });

    // Filter to isolate the issue
    await page.goto(`/issues?search=${encodeURIComponent(issue.title)}`);
    await expect(page.getByText("Kbd Cancel Issue")).toBeVisible();

    // Press j to focus
    await page.keyboard.press("j");
    const row = page.locator(`[data-issue-id="${issue.id}"].bg-city-yellow\\/10`);
    await expect(row).toBeVisible();

    await page.keyboard.press("x");
    await page.waitForTimeout(500);

    // Verify via API
    const res = await page.request.get(`/api/issues/${issue.id}`);
    const data = await res.json();
    expect(data.status).toBe("cancelled");
  });

  test("gg jumps to first issue", async ({ page, api }) => {
    await api.createIssue({ title: "GG First Issue", status: "backlog" });
    await api.createIssue({ title: "GG Second Issue", status: "backlog" });
    await api.createIssue({ title: "GG Third Issue", status: "backlog" });

    await page.goto("/issues");
    await expect(page.getByText("GG First Issue")).toBeVisible();

    // Navigate down a few times
    await page.keyboard.press("j");
    await page.keyboard.press("j");
    await page.keyboard.press("j");

    // Press gg to jump to top
    await page.keyboard.press("g");
    await page.keyboard.press("g");
    await page.waitForTimeout(300);

    // The first visible issue row should be focused
    const firstRow = page.locator("[data-issue-id]").first();
    await expect(firstRow).toHaveClass(/bg-city-yellow/);
  });

  test("G (shift+g) jumps to last issue", async ({ page, api }) => {
    await api.createIssue({ title: "ShiftG First Issue", status: "backlog" });
    await api.createIssue({ title: "ShiftG Last Issue", status: "backlog" });

    await page.goto("/issues");
    await expect(page.getByText("ShiftG First Issue")).toBeVisible();

    // First focus something
    await page.keyboard.press("j");
    await page.waitForTimeout(200);

    // Press Shift+G to jump to last
    await page.keyboard.press("Shift+g");
    await page.waitForTimeout(300);

    // Verify that some issue has focus (bg-city-yellow class)
    const focusedRow = page.locator("[data-issue-id].bg-city-yellow\\/10");
    await expect(focusedRow).toBeVisible();
  });

  test("Backspace deletes focused issue", async ({ page, api }) => {
    const issue = await api.createIssue({ title: "Backspace Delete Issue" });

    // Filter to isolate the issue
    await page.goto(`/issues?search=${encodeURIComponent(issue.title)}`);
    await expect(page.getByText("Backspace Delete Issue")).toBeVisible();

    // Press j to focus
    await page.keyboard.press("j");
    const row = page.locator(`[data-issue-id="${issue.id}"].bg-city-yellow\\/10`);
    await expect(row).toBeVisible();

    // Press Backspace to delete
    await page.keyboard.press("Backspace");

    // Should see deletion toast
    await expect(page.getByText(/Deleted City-/)).toBeVisible();

    // Verify via API
    await page.waitForTimeout(500);
    const res = await page.request.get(`/api/issues/${issue.id}`);
    expect(res.status()).toBe(404);
  });

  test(". repeats last action on focused issue", async ({ page, api }) => {
    const issue1 = await api.createIssue({ title: "Repeat Issue 1", status: "backlog" });
    const issue2 = await api.createIssue({ title: "Repeat Issue 2", status: "backlog" });

    // Filter to isolate the issue1
    await page.goto(`/issues?search=${encodeURIComponent(issue1.title)}`);
    await expect(page.getByText("Repeat Issue 1")).toBeVisible();

    // Focus first issue and mark done
    await page.keyboard.press("j");
    await page.locator(`[data-issue-id="${issue1.id}"].bg-city-yellow\\/10`).waitFor({ state: 'visible' });

    await page.keyboard.press("d"); // mark done
    await page.waitForTimeout(500);

    // Filter to isolate issue2
    await page.goto(`/issues?search=${encodeURIComponent(issue2.title)}`);
    await expect(page.getByText("Repeat Issue 2")).toBeVisible();

    // Focus second issue
    await page.keyboard.press("j");
    await page.locator(`[data-issue-id="${issue2.id}"].bg-city-yellow\\/10`).waitFor({ state: 'visible' });

    await page.keyboard.press("."); // repeat last action (mark done)
    await page.waitForTimeout(500);

    // Verify both issues are done via API
    const res1 = await page.request.get(`/api/issues/${issue1.id}`);
    const data1 = await res1.json();
    expect(data1.status).toBe("done");

    const res2 = await page.request.get(`/api/issues/${issue2.id}`);
    const data2 = await res2.json();
    expect(data2.status).toBe("done");
  });
});
