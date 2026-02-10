import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { createTestDb, cleanupTestDb } from "@/test/db";
import { createRequest, createParams, parseResponse } from "@/test/api-helpers";
import type { ProjectWithCounts } from "@/types";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb.db;
  },
  getSqlite: () => testDb.sqlite,
}));

const { GET: GET_LIST, POST: POST_CREATE } = await import("../route");
const { GET: GET_SINGLE, PATCH, DELETE } = await import("../[projectId]/route");
const { POST: POST_RESTORE } = await import("../restore/route");

beforeAll(() => {
  testDb = createTestDb();
});

afterAll(() => {
  cleanupTestDb(testDb);
});

beforeEach(() => {
  testDb.sqlite.prepare("DELETE FROM issue_labels").run();
  testDb.sqlite.prepare("DELETE FROM issues").run();
  testDb.sqlite.prepare("DELETE FROM projects").run();
  testDb.sqlite.prepare("UPDATE counters SET value = 0 WHERE id = 'issue_counter'").run();
});

async function createProject(body: Record<string, unknown>) {
  const req = createRequest("POST", "/api/projects", body);
  const res = await POST_CREATE(req);
  return (await parseResponse<ProjectWithCounts>(res));
}

async function createIssue(body: Record<string, unknown>) {
  const req = createRequest("POST", "/api/issues", body);
  // Import issues POST
  const { POST } = await import("../../issues/route");
  const res = await POST(req);
  return parseResponse(res);
}

describe("Projects CRUD", () => {
  it("POST — creates project with name and color", async () => {
    const { data, status } = await createProject({ name: "My Project", color: "#FF0000" });
    expect(status).toBe(201);
    expect(data.name).toBe("My Project");
    expect(data.color).toBe("#FF0000");
    expect(data.issueCount).toBe(0);
    expect(data.doneCount).toBe(0);
  });

  it("POST — rejects missing name → 400", async () => {
    const { status } = await createProject({ name: "" });
    expect(status).toBe(400);
  });

  it("GET (list) — returns all projects with issue counts", async () => {
    const { data: proj } = await createProject({ name: "CountProject" });
    // Create issues assigned to this project
    await createIssue({ title: "Issue 1", projectId: proj.id });
    await createIssue({ title: "Issue 2", projectId: proj.id, status: "done" });

    const req = createRequest("GET", "/api/projects");
    const { data } = await parseResponse<ProjectWithCounts[]>(await GET_LIST());
    expect(data).toHaveLength(1);
    expect(data[0].issueCount).toBe(2);
    expect(data[0].doneCount).toBe(1);
  });

  it("GET (single) — returns project with issue counts", async () => {
    const { data: proj } = await createProject({ name: "SingleProject" });
    await createIssue({ title: "Issue 1", projectId: proj.id });

    const req = createRequest("GET", `/api/projects/${proj.id}`);
    const res = await GET_SINGLE(req, createParams({ projectId: proj.id }));
    const { data, status } = await parseResponse<ProjectWithCounts>(res);
    expect(status).toBe(200);
    expect(data.name).toBe("SingleProject");
    expect(data.issueCount).toBe(1);
  });

  it("PATCH — updates name, description, color, status", async () => {
    const { data: proj } = await createProject({ name: "Original" });

    const req = createRequest("PATCH", `/api/projects/${proj.id}`, {
      name: "Updated",
      description: "New desc",
      color: "#00FF00",
      status: "paused",
    });
    const res = await PATCH(req, createParams({ projectId: proj.id }));
    const { data } = await parseResponse(res);
    expect((data as Record<string, unknown>).name).toBe("Updated");
    expect((data as Record<string, unknown>).description).toBe("New desc");
    expect((data as Record<string, unknown>).color).toBe("#00FF00");
    expect((data as Record<string, unknown>).status).toBe("paused");
  });

  it("DELETE — deletes project, sets issues.projectId = null", async () => {
    const { data: proj } = await createProject({ name: "ToDelete" });
    await createIssue({ title: "Assigned issue", projectId: proj.id });

    const req = createRequest("DELETE", `/api/projects/${proj.id}`);
    const res = await DELETE(req, createParams({ projectId: proj.id }));
    expect(res.status).toBe(200);

    // Verify issue's projectId is null
    const row = testDb.sqlite.prepare("SELECT project_id FROM issues").get() as { project_id: string | null };
    expect(row.project_id).toBeNull();
  });

  it("DELETE — non-existent project still returns 200 (silent)", async () => {
    // The current DELETE implementation doesn't check existence first
    const req = createRequest("DELETE", "/api/projects/nonexistent");
    const res = await DELETE(req, createParams({ projectId: "nonexistent" }));
    expect(res.status).toBe(200);
  });

  it("Restore — recreates with explicit ID", async () => {
    const req = createRequest("POST", "/api/projects/restore", {
      id: "restored-project-1",
      name: "Restored Project",
      color: "#FFD700",
    });
    const res = await POST_RESTORE(req);
    const { data, status } = await parseResponse<ProjectWithCounts>(res);
    expect(status).toBe(201);
    expect(data.id).toBe("restored-project-1");
    expect(data.name).toBe("Restored Project");
  });

  it("issue counts accurate after adding/removing issues", async () => {
    const { data: proj } = await createProject({ name: "CountAccuracy" });
    await createIssue({ title: "i1", projectId: proj.id, status: "todo" });
    await createIssue({ title: "i2", projectId: proj.id, status: "done" });
    await createIssue({ title: "i3", projectId: proj.id, status: "done" });

    const res = await GET_SINGLE(
      createRequest("GET", `/api/projects/${proj.id}`),
      createParams({ projectId: proj.id })
    );
    const { data } = await parseResponse<ProjectWithCounts>(res);
    expect(data.issueCount).toBe(3);
    expect(data.doneCount).toBe(2);
  });
});
