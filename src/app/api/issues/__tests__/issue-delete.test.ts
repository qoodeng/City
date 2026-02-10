import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { createTestDb, cleanupTestDb } from "@/test/db";
import { createRequest, createParams, parseResponse } from "@/test/api-helpers";
import type { IssueWithLabels } from "@/types";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb.db;
  },
  getSqlite: () => testDb.sqlite,
}));

const { POST } = await import("../route");
const { DELETE, GET } = await import("../[issueId]/route");

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

describe("DELETE /api/issues/:id", () => {
  it("deletes issue → 200", async () => {
    const issue = await createIssue({ title: "To delete" });
    const req = createRequest("DELETE", `/api/issues/${issue.id}`);
    const res = await DELETE(req, createParams({ issueId: issue.id }));
    expect(res.status).toBe(200);

    // Verify it's gone
    const getRes = await GET(
      createRequest("GET", `/api/issues/${issue.id}`),
      createParams({ issueId: issue.id })
    );
    expect(getRes.status).toBe(404);
  });

  it("children retain parentId after parent deletion (no FK constraint on parentId)", async () => {
    const parent = await createIssue({ title: "Parent" });
    const child = await createIssue({ title: "Child", parentId: parent.id });

    // Delete parent
    await DELETE(
      createRequest("DELETE", `/api/issues/${parent.id}`),
      createParams({ issueId: parent.id })
    );

    // parentId column has no FK, so child retains the (now-orphaned) parentId
    const row = testDb.sqlite.prepare("SELECT parent_id FROM issues WHERE id = ?").get(child.id) as { parent_id: string | null };
    expect(row.parent_id).toBe(parent.id);
  });

  it("junction rows cascade-deleted", async () => {
    const labelId = "label-cascade-test";
    testDb.sqlite.prepare("INSERT OR IGNORE INTO labels (id, name, color, created_at, updated_at) VALUES (?, 'CascadeLabel', '#F00', datetime('now'), datetime('now'))").run(labelId);

    const issue = await createIssue({ title: "Labeled", labelIds: [labelId] });

    // Verify junction row exists
    const before = testDb.sqlite.prepare("SELECT count(*) as cnt FROM issue_labels WHERE issue_id = ?").get(issue.id) as { cnt: number };
    expect(before.cnt).toBe(1);

    // Delete issue
    await DELETE(
      createRequest("DELETE", `/api/issues/${issue.id}`),
      createParams({ issueId: issue.id })
    );

    // Verify junction rows are gone
    const after = testDb.sqlite.prepare("SELECT count(*) as cnt FROM issue_labels WHERE issue_id = ?").get(issue.id) as { cnt: number };
    expect(after.cnt).toBe(0);
  });

  it("non-existent ID → 404", async () => {
    const req = createRequest("DELETE", "/api/issues/nonexistent");
    const res = await DELETE(req, createParams({ issueId: "nonexistent" }));
    expect(res.status).toBe(404);
  });
});
