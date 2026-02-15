import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { createTestDb, cleanupTestDb } from "@/test/db";
import { parseResponse } from "@/test/api-helpers";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb.db;
  },
  getSqlite: () => testDb.sqlite,
}));

const { GET } = await import("../route");

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

let issueCounter = 1;

function insertIssue(overrides: Record<string, unknown> = {}) {
  const defaults = {
    id: `issue-${Math.random().toString(36).slice(2)}`,
    number: issueCounter++,
    title: "Test issue",
    status: "backlog",
    priority: "none",
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const merged = { ...defaults, ...overrides };
  testDb.sqlite.prepare(`
    INSERT INTO issues (id, number, title, status, priority, sort_order, created_at, updated_at, due_date, project_id)
    VALUES (@id, @number, @title, @status, @priority, @sort_order, @created_at, @updated_at, @due_date, @project_id)
  `).run({ due_date: null, project_id: null, ...merged });
  return merged;
}

interface DashboardResponse {
  dueThisWeek: unknown[];
  recentlyUpdated: unknown[];
  staleIssues: unknown[];
  statusDistribution: Record<string, number>;
  totalIssues: number;
}

describe("GET /api/dashboard", () => {
  it("returns status distribution counts matching actual data", async () => {
    insertIssue({ status: "todo" });
    insertIssue({ status: "todo" });
    insertIssue({ status: "in_progress" });
    insertIssue({ status: "done" });

    const res = await GET();
    const { data } = await parseResponse<DashboardResponse>(res);
    expect(data.statusDistribution.todo).toBe(2);
    expect(data.statusDistribution.in_progress).toBe(1);
    expect(data.statusDistribution.done).toBe(1);
  });

  it("dueThisWeek only includes non-done/cancelled issues with upcoming due dates", async () => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000);

    insertIssue({ status: "todo", due_date: tomorrow.toISOString().split("T")[0] });
    insertIssue({ status: "done", due_date: tomorrow.toISOString().split("T")[0] }); // excluded: done
    insertIssue({ status: "todo", due_date: nextWeek.toISOString().split("T")[0] }); // excluded: too far

    const res = await GET();
    const { data } = await parseResponse<DashboardResponse>(res);
    expect(data.dueThisWeek).toHaveLength(1);
  });

  it("staleIssues only includes in_progress issues not updated in 7+ days", async () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

    insertIssue({ status: "in_progress", updated_at: twoWeeksAgo.toISOString() }); // stale
    insertIssue({ status: "in_progress", updated_at: yesterday.toISOString() }); // not stale
    insertIssue({ status: "todo", updated_at: twoWeeksAgo.toISOString() }); // wrong status

    const res = await GET();
    const { data } = await parseResponse<DashboardResponse>(res);
    expect(data.staleIssues).toHaveLength(1);
  });

  it("recentlyUpdated returns last 10 issues by updatedAt", async () => {
    for (let i = 0; i < 15; i++) {
      insertIssue({
        title: `Issue ${i}`,
        updated_at: new Date(Date.now() - i * 1000).toISOString(),
      });
    }

    const res = await GET();
    const { data } = await parseResponse<DashboardResponse>(res);
    expect(data.recentlyUpdated).toHaveLength(10);
  });

  it("totalIssues count is accurate", async () => {
    insertIssue();
    insertIssue();
    insertIssue();

    const res = await GET();
    const { data } = await parseResponse<DashboardResponse>(res);
    expect(data.totalIssues).toBe(3);
  });
});
