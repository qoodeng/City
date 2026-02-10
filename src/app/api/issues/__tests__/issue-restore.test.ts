import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { createTestDb, cleanupTestDb } from "@/test/db";
import { createRequest, parseResponse } from "@/test/api-helpers";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb.db;
  },
  getSqlite: () => testDb.sqlite,
}));

const { POST } = await import("../restore/route");

beforeAll(() => {
  testDb = createTestDb();
});

afterAll(() => {
  cleanupTestDb(testDb);
});

beforeEach(() => {
  testDb.sqlite.prepare("DELETE FROM issue_labels").run();
  testDb.sqlite.prepare("DELETE FROM issues").run();
});

describe("POST /api/issues/restore", () => {
  it("restores deleted issue with explicit ID and number (no counter bump)", async () => {
    const counterBefore = testDb.sqlite.prepare("SELECT value FROM counters WHERE id = 'issue_counter'").get() as { value: number };

    const req = createRequest("POST", "/api/issues/restore", {
      id: "restored-issue-1",
      number: 42,
      title: "Restored Issue",
      status: "todo",
      priority: "high",
    });
    const res = await POST(req);
    const { data, status } = await parseResponse(res);
    expect(status).toBe(201);
    expect((data as Record<string, unknown>).id).toBe("restored-issue-1");
    expect((data as Record<string, unknown>).number).toBe(42);

    // Counter should not have changed
    const counterAfter = testDb.sqlite.prepare("SELECT value FROM counters WHERE id = 'issue_counter'").get() as { value: number };
    expect(counterAfter.value).toBe(counterBefore.value);
  });

  it("restores labels from previousState", async () => {
    // Create label first
    const labelId = "label-restore-test";
    testDb.sqlite.prepare("INSERT OR IGNORE INTO labels (id, name, color, created_at, updated_at) VALUES (?, 'RestoreLabel', '#F00', datetime('now'), datetime('now'))").run(labelId);

    const req = createRequest("POST", "/api/issues/restore", {
      id: "restored-with-labels",
      number: 43,
      title: "With Labels",
      labels: [{ id: labelId }],
    });
    const res = await POST(req);
    const { data } = await parseResponse(res);
    const labels = (data as Record<string, unknown>).labels as Array<{ id: string }>;
    expect(labels).toHaveLength(1);
    expect(labels[0].id).toBe(labelId);
  });

  it("restores with parentId", async () => {
    // Create parent first
    testDb.sqlite.prepare("INSERT INTO issues (id, number, title, status, priority, sort_order, created_at, updated_at) VALUES ('parent-for-restore', 99, 'Parent', 'backlog', 'none', 0, datetime('now'), datetime('now'))").run();

    const req = createRequest("POST", "/api/issues/restore", {
      id: "restored-child",
      number: 44,
      title: "Restored Child",
      parentId: "parent-for-restore",
    });
    const res = await POST(req);
    const { data } = await parseResponse(res);
    expect((data as Record<string, unknown>).parentId).toBe("parent-for-restore");
  });

  it("rejects duplicate ID → 409 (existence check)", async () => {
    testDb.sqlite.prepare("INSERT INTO issues (id, number, title, status, priority, sort_order, created_at, updated_at) VALUES ('existing-id', 50, 'Existing', 'backlog', 'none', 0, datetime('now'), datetime('now'))").run();

    const req = createRequest("POST", "/api/issues/restore", {
      id: "existing-id",
      number: 51,
      title: "Duplicate",
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });
});
