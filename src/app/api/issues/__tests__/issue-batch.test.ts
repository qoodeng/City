import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { createTestDb, cleanupTestDb } from "@/test/db";
import { createRequest, parseResponse } from "@/test/api-helpers";
import type { IssueWithLabels } from "@/types";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb.db;
  },
  getSqlite: () => testDb.sqlite,
}));

const { PATCH } = await import("../batch/route");
const { POST } = await import("../route");

beforeAll(() => {
  testDb = createTestDb();
});

afterAll(() => {
  cleanupTestDb(testDb);
});

beforeEach(() => {
  testDb.sqlite.prepare("DELETE FROM issue_labels").run();
  testDb.sqlite.prepare("DELETE FROM issues").run();
  testDb.sqlite.prepare("UPDATE counters SET value = 0 WHERE id = 'issue_counter'").run();
});

async function createIssue(body: Record<string, unknown>) {
  const req = createRequest("POST", "/api/issues", body);
  const res = await POST(req);
  return (await parseResponse<IssueWithLabels>(res)).data;
}

describe("PATCH /api/issues/batch", () => {
  it("batch update status on multiple issues", async () => {
    const i1 = await createIssue({ title: "Issue 1" });
    const i2 = await createIssue({ title: "Issue 2" });

    const req = createRequest("PATCH", "/api/issues/batch", {
      issueIds: [i1.id, i2.id],
      updates: { status: "done" },
    });
    const res = await PATCH(req);
    const { data, status } = await parseResponse(res);
    expect(status).toBe(200);
    expect((data as { success: boolean }).success).toBe(true);

    // Verify in DB
    const rows = testDb.sqlite.prepare("SELECT status FROM issues WHERE id IN (?, ?)").all(i1.id, i2.id) as { status: string }[];
    expect(rows.every((r) => r.status === "done")).toBe(true);
  });

  it("batch update priority", async () => {
    const i1 = await createIssue({ title: "Issue 1" });
    const i2 = await createIssue({ title: "Issue 2" });

    const req = createRequest("PATCH", "/api/issues/batch", {
      issueIds: [i1.id, i2.id],
      updates: { priority: "urgent" },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const rows = testDb.sqlite.prepare("SELECT priority FROM issues WHERE id IN (?, ?)").all(i1.id, i2.id) as { priority: string }[];
    expect(rows.every((r) => r.priority === "urgent")).toBe(true);
  });

  it("handles mix of valid and invalid IDs gracefully", async () => {
    const i1 = await createIssue({ title: "Issue 1" });

    const req = createRequest("PATCH", "/api/issues/batch", {
      issueIds: [i1.id, "nonexistent-id"],
      updates: { status: "done" },
    });
    const res = await PATCH(req);
    // Should still succeed since SQLite UPDATE with non-matching IDs just updates fewer rows
    expect(res.status).toBe(200);

    const row = testDb.sqlite.prepare("SELECT status FROM issues WHERE id = ?").get(i1.id) as { status: string };
    expect(row.status).toBe("done");
  });

  it("empty IDs array → 400", async () => {
    const req = createRequest("PATCH", "/api/issues/batch", {
      issueIds: [],
      updates: { status: "done" },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});
