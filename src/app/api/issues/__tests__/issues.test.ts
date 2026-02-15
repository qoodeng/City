import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { createTestDb, cleanupTestDb } from "@/test/db";
import { createRequest, createParams, parseResponse } from "@/test/api-helpers";
import type { IssueWithLabels } from "@/types";

let testDb: ReturnType<typeof createTestDb>;

// Mock @/lib/db to use test DB
vi.mock("@/lib/db", () => ({
  get db() {
    return testDb.db;
  },
  getSqlite: () => testDb.sqlite,
}));

// Must import AFTER mocks
const { GET, POST } = await import("../route");
const { GET: GET_SINGLE } = await import("../[issueId]/route");

beforeAll(() => {
  testDb = createTestDb();
});

afterAll(() => {
  cleanupTestDb(testDb);
});

// Helper to create an issue via POST
async function createIssue(body: Record<string, unknown>) {
  const req = createRequest("POST", "/api/issues", body);
  const res = await POST(req);
  return parseResponse<IssueWithLabels>(res);
}

describe("POST /api/issues", () => {
  it("creates issue with title only → returns 201, auto-incremented number", async () => {
    const { data, status } = await createIssue({ title: "My first issue" });
    expect(status).toBe(201);
    expect(data.title).toBe("My first issue");
    expect(data.number).toBe(1);
    expect(data.status).toBe("backlog");
    expect(data.priority).toBe("none");
    expect(data.labels).toEqual([]);
  });

  it("creates issue with all fields", async () => {
    const { data, status } = await createIssue({
      title: "Full issue",
      description: "A description",
      status: "todo",
      priority: "high",
      assignee: "christian",
      dueDate: "2025-12-31",
    });
    expect(status).toBe(201);
    expect(data.title).toBe("Full issue");
    expect(data.description).toBe("A description");
    expect(data.status).toBe("todo");
    expect(data.priority).toBe("high");
    expect(data.assignee).toBe("christian");
    expect(data.dueDate).toBe("2025-12-31");
  });

  it("creates issue with labels → junction rows created", async () => {
    // First create a label directly
    const labelId = "test-label-1";
    testDb.sqlite.prepare("INSERT INTO labels (id, name, color, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))").run(labelId, "TestLabel", "#FF0000");

    const { data, status } = await createIssue({
      title: "Labeled issue",
      labelIds: [labelId],
    });
    expect(status).toBe(201);
    expect(data.labels).toHaveLength(1);
    expect(data.labels[0].name).toBe("TestLabel");
  });

  it("creates issue with parentId → linked to parent", async () => {
    const parent = await createIssue({ title: "Parent issue" });
    const { data } = await createIssue({
      title: "Child issue",
      parentId: parent.data.id,
    });
    expect(data.parentId).toBe(parent.data.id);
  });

  it("sequential creates → numbers increment atomically", async () => {
    // Reset counter
    testDb.sqlite.prepare("UPDATE counters SET value = 100 WHERE id = 'issue_counter'").run();
    const r1 = await createIssue({ title: "Issue A" });
    const r2 = await createIssue({ title: "Issue B" });
    const r3 = await createIssue({ title: "Issue C" });
    expect(r1.data.number).toBe(101);
    expect(r2.data.number).toBe(102);
    expect(r3.data.number).toBe(103);
  });

  it("rejects missing title → 400", async () => {
    const { status, data } = await createIssue({ title: "" });
    expect(status).toBe(400);
    expect((data as unknown as { error: string }).error).toBe("Title is required");
  });

  it("returns 500 when database transaction fails", async () => {
    // Spy on the transaction method and make it throw
    const transactionSpy = vi.spyOn(testDb.db, "transaction").mockImplementation(() => {
      throw new Error("DB Error");
    });

    try {
      const { status, data } = await createIssue({ title: "Crash me" });

      expect(status).toBe(500);
      expect((data as unknown as { error: string }).error).toBe("Failed to create issue");
    } finally {
      // Restore the spy
      transactionSpy.mockRestore();
    }
  });
});

describe("GET /api/issues", () => {
  beforeEach(() => {
    // Clean issues for fresh state
    testDb.sqlite.prepare("DELETE FROM issue_labels").run();
    testDb.sqlite.prepare("DELETE FROM issues").run();
    testDb.sqlite.prepare("UPDATE counters SET value = 0 WHERE id = 'issue_counter'").run();
  });

  it("returns all issues enriched with labels and project", async () => {
    await createIssue({ title: "Issue 1" });
    await createIssue({ title: "Issue 2" });

    const req = createRequest("GET", "/api/issues");
    const res = await GET(req);
    const { data, status } = await parseResponse<IssueWithLabels[]>(res);

    expect(status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0]).toHaveProperty("labels");
  });

  it("filters by single status", async () => {
    await createIssue({ title: "Todo issue", status: "todo" });
    await createIssue({ title: "Done issue", status: "done" });

    const req = createRequest("GET", "/api/issues?status=todo");
    const { data } = await parseResponse<IssueWithLabels[]>(await GET(req));
    expect(data).toHaveLength(1);
    expect(data[0].status).toBe("todo");
  });

  it("filters by multiple statuses", async () => {
    await createIssue({ title: "Todo", status: "todo" });
    await createIssue({ title: "Done", status: "done" });
    await createIssue({ title: "Backlog", status: "backlog" });

    const req = createRequest("GET", "/api/issues?status=todo&status=done");
    const { data } = await parseResponse<IssueWithLabels[]>(await GET(req));
    expect(data).toHaveLength(2);
  });

  it("filters by priority", async () => {
    await createIssue({ title: "High", priority: "high" });
    await createIssue({ title: "Low", priority: "low" });

    const req = createRequest("GET", "/api/issues?priority=high");
    const { data } = await parseResponse<IssueWithLabels[]>(await GET(req));
    expect(data).toHaveLength(1);
    expect(data[0].priority).toBe("high");
  });

  it("filters by projectId", async () => {
    const projId = "proj-filter-test";
    testDb.sqlite.prepare("INSERT INTO projects (id, name, color, icon, status, sort_order, created_at, updated_at) VALUES (?, 'P1', '#FFF', 'folder', 'active', 0, datetime('now'), datetime('now'))").run(projId);

    await createIssue({ title: "With project", projectId: projId });
    await createIssue({ title: "Without project" });

    const req = createRequest("GET", `/api/issues?projectId=${projId}`);
    const { data } = await parseResponse<IssueWithLabels[]>(await GET(req));
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("With project");
  });

  it("filters by label", async () => {
    const labelId = "label-filter-test";
    testDb.sqlite.prepare("INSERT OR IGNORE INTO labels (id, name, color, created_at, updated_at) VALUES (?, 'FilterLabel', '#FF0', datetime('now'), datetime('now'))").run(labelId);

    await createIssue({ title: "Labeled", labelIds: [labelId] });
    await createIssue({ title: "Unlabeled" });

    const req = createRequest("GET", `/api/issues?label=${labelId}`);
    const { data } = await parseResponse<IssueWithLabels[]>(await GET(req));
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Labeled");
  });

  it("sorts by number desc", async () => {
    await createIssue({ title: "First" });
    await createIssue({ title: "Second" });

    const req = createRequest("GET", "/api/issues?sort=number&order=desc");
    const { data } = await parseResponse<IssueWithLabels[]>(await GET(req));
    // Desc: higher number first
    expect(data[0].title).toBe("Second");
    expect(data[1].title).toBe("First");
  });

  it("sort order asc", async () => {
    await createIssue({ title: "First" });
    await createIssue({ title: "Second" });

    const req = createRequest("GET", "/api/issues?sort=number&order=asc");
    const { data } = await parseResponse<IssueWithLabels[]>(await GET(req));
    expect(data[0].title).toBe("First");
    expect(data[1].title).toBe("Second");
  });

  it("search via FTS5 — finds by title content", async () => {
    await createIssue({ title: "Authentication bug fix" });
    await createIssue({ title: "Unrelated task" });

    const req = createRequest("GET", "/api/issues?search=Authentication");
    const { data } = await parseResponse<IssueWithLabels[]>(await GET(req));
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Authentication bug fix");
  });

  it("search via FTS5 — finds by description content", async () => {
    await createIssue({ title: "Some issue", description: "Fix the broken login flow" });
    await createIssue({ title: "Other issue" });

    const req = createRequest("GET", "/api/issues?search=login");
    const { data } = await parseResponse<IssueWithLabels[]>(await GET(req));
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Some issue");
  });

  it("FTS5 invalid syntax falls back to LIKE", async () => {
    await createIssue({ title: "Special chars test" });

    // Invalid FTS syntax with unmatched quotes
    const req = createRequest("GET", '/api/issues?search="unclosed');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});

describe("GET /api/issues/:id", () => {
  it("returns issue with children, parent, labels, and project", async () => {
    const parent = await createIssue({ title: "Parent" });
    await createIssue({ title: "Child", parentId: parent.data.id });

    const req = createRequest("GET", `/api/issues/${parent.data.id}`);
    const res = await GET_SINGLE(req, createParams({ issueId: parent.data.id }));
    const { data, status } = await parseResponse<IssueWithLabels>(res);
    expect(status).toBe(200);
    expect(data.title).toBe("Parent");
    expect(data.children).toBeDefined();
    expect(data.children!.length).toBeGreaterThanOrEqual(1);
  });

  it("returns 404 for non-existent ID", async () => {
    const req = createRequest("GET", "/api/issues/nonexistent");
    const res = await GET_SINGLE(req, createParams({ issueId: "nonexistent" }));
    expect(res.status).toBe(404);
  });
});
