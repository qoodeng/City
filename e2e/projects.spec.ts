import { test, expect } from "./fixtures";

test.describe("Projects", () => {
  test("projects page loads with grid", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("create project via dialog", async ({ page }) => {
    await page.goto("/projects");

    // Click "New Project" button
    await page.getByRole("button", { name: "New Project" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create Project" })).toBeVisible();

    // Create button should be disabled without name
    const createBtn = page.getByRole("button", { name: "Create Project" });
    await expect(createBtn).toBeDisabled();

    // Fill name
    await page.getByPlaceholder("Project name").fill("E2E Test Project");
    await expect(createBtn).toBeEnabled();

    // Submit
    await createBtn.click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText(/Created project/)).toBeVisible();
  });

  test("project card shows name and issue count", async ({ page, api }) => {
    const _project = await api.createProject({ name: "Card Test Project" });
    await api.createIssue({ title: "Card Project Issue", projectId: project.id });

    await page.goto("/projects");

    // Use the h3 heading inside the card specifically
    const projectCard = page.locator("a").filter({ has: page.locator("h3", { hasText: "Card Test Project" }) });
    await expect(projectCard).toBeVisible();
    // Issue count should be visible on the card
    await expect(projectCard.getByText(/1.*issues/)).toBeVisible();
  });

  test("navigate to project detail page", async ({ page, api }) => {
    const _project = await api.createProject({ name: "Navigate Project" });

    await page.goto("/projects");

    // Click on the project card specifically (not the sidebar link)
    const projectCard = page.locator("main a").filter({ has: page.locator("h3", { hasText: "Navigate Project" }) });
    await projectCard.click();
    await expect(page.getByRole("heading", { name: "Navigate Project" })).toBeVisible();
  });

  test("project detail shows filtered issues", async ({ page, api }) => {
    const _project = await api.createProject({ name: "Detail Project" });
    await api.createIssue({ title: "Project Detail Issue", projectId: project.id });
    await api.createIssue({ title: "Other Issue Not In Project" });

    await page.goto(`/projects/${project.id}`);
    await expect(page.getByRole("heading", { name: "Detail Project" })).toBeVisible();

    // Only project issue should be visible
    await expect(page.getByText("Project Detail Issue")).toBeVisible();
    await expect(page.getByText("Other Issue Not In Project")).toBeHidden();
  });

  test("project settings: edit name and save", async ({ page, api }) => {
    const _project = await api.createProject({ name: "Settings Project" });

    await page.goto(`/projects/${project.id}/settings`);
    await expect(page.getByText("Project Settings")).toBeVisible();

    // Name input should have current name
    const nameInput = page.getByRole("textbox").first();
    await expect(nameInput).toHaveValue("Settings Project");

    // Change name
    await nameInput.fill("Updated Project Name");

    // Save
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Project updated")).toBeVisible();
  });

  test("delete project from settings", async ({ page, api }) => {
    const _project = await api.createProject({ name: "Delete Me Project" });

    await page.goto(`/projects/${project.id}/settings`);
    await expect(page.getByText("Project Settings")).toBeVisible();

    // Find danger zone
    await expect(page.getByText("Danger Zone")).toBeVisible();

    // Click delete button
    await page.getByRole("button", { name: "Delete Project" }).click();

    // Should redirect to projects list
    await expect(page.getByText("Project deleted")).toBeVisible();
    await expect(page).toHaveURL("/projects");
  });
});
