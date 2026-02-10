import { test, expect } from "./fixtures";

test.describe("Navigation", () => {
  test("sidebar links navigate to correct pages", async ({ page }) => {
    await page.goto("/");

    // Dashboard is the home page
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // Navigate to Issues
    await page.getByRole("link", { name: "All Issues" }).click();
    await expect(page.getByRole("heading", { name: "All Issues" })).toBeVisible();

    // Navigate to Projects
    await page.getByRole("link", { name: "Projects" }).click();
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

    // Navigate back to Dashboard (scoped to sidebar to avoid matching issue titles)
    await page.locator("aside").getByRole("link", { name: "Dashboard" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("back and forward buttons work", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "All Issues" }).click();
    await expect(page.getByRole("heading", { name: "All Issues" })).toBeVisible();

    await page.goBack();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    await page.goForward();
    await expect(page.getByRole("heading", { name: "All Issues" })).toBeVisible();
  });

  test("sidebar collapse and expand toggle", async ({ page }) => {
    await page.goto("/");

    // Sidebar should show full text initially
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("C.I.T.Y.")).toBeVisible();

    // Toggle sidebar via keyboard shortcut (Cmd+/)
    await page.keyboard.press("Meta+/");

    // Sidebar should be collapsed — full text links should be hidden
    await expect(sidebar.getByText("C.I.T.Y.")).toBeHidden();

    // Expand again
    await page.keyboard.press("Meta+/");
    await expect(sidebar.getByText("C.I.T.Y.")).toBeVisible();
  });

  test("active link is highlighted", async ({ page }) => {
    await page.goto("/issues");
    await expect(page.getByRole("heading", { name: "All Issues" })).toBeVisible();

    // The "All Issues" link should have the active class (city-yellow text)
    const issuesLink = page.locator("aside").getByRole("link", { name: "All Issues" });
    await expect(issuesLink).toHaveClass(/text-city-yellow/);

    // Navigate to Projects - active class should move
    await page.getByRole("link", { name: "Projects" }).click();
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();

    const projectsLink = page.locator("aside").getByRole("link", { name: "Projects" });
    await expect(projectsLink).toHaveClass(/text-city-yellow/);
  });
});
