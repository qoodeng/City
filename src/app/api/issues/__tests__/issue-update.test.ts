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
const { PATCH } = await import("../[issueId]/route");

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

async function patchIssue(id: string, body: Record<string, unknown>) {
  const req = createRequest("PATCH", `/api/issues/${id}`, body);
  return PATCH(req, createParams({ issueId: id }));
}

describe("PATCH /api/issues/:id", () => {
  it("updates title", async () => {
    const issue = await createIssue({ title: "Original" });
    const res = await patchIssue(issue.id, { title: "Updated" });
    const { data } = await parseResponse<IssueWithLabels>(res);
    expect(data.title).toBe("Updated");
  });

  it("updates status", async () => {
    const issue = await createIssue({ title: "Status test" });
    const res = await patchIssue(issue.id, { status: "in_progress" });
    const { data } = await parseResponse<IssueWithLabels>(res);
    expect(data.status).toBe("in_progress");
  });

  it("updates priority", async () => {
    const issue = await createIssue({ title: "Priority test" });
    const res = await patchIssue(issue.id, { priority: "urgent" });
    const { data } = await parseResponse<IssueWithLabels>(res);
    expect(data.priority).toBe("urgent");
  });

  it("updates assignee", async () => {
    const issue = await createIssue({ title: "Assignee test" });
    const res = await patchIssue(issue.id, { assignee: "christian" });
    const { data } = await parseResponse<IssueWithLabels>(res);
    expect(data.assignee).toBe("christian");
  });

  it("updates projectId (set and clear)", async () => {
    const projId = "proj-update-test";
    testDb.sqlite.prepare("INSERT INTO projects (id, name, color, icon, status, sort_order, created_at, updated_at) VALUES (?, 'P', '#FFF', 'folder', 'active', 0, datetime('now'), datetime('now'))").run(projId);

    const issue = await createIssue({ title: "Project test" });

    // Set
    const res1 = await patchIssue(issue.id, { projectId: projId });
    const { data: d1 } = await parseResponse<IssueWithLabels>(res1);
    expect(d1.projectId).toBe(projId);

    // Clear
    const res2 = await patchIssue(issue.id, { projectId: null });
    const { data: d2 } = await parseResponse<IssueWithLabels>(res2);
    expect(d2.projectId).toBeNull();
  });

  it("updates dueDate (set and clear)", async () => {
    const issue = await createIssue({ title: "Due date test" });

    const res1 = await patchIssue(issue.id, { dueDate: "2025-06-15" });
    const { data: d1 } = await parseResponse<IssueWithLabels>(res1);
    expect(d1.dueDate).toBe("2025-06-15");

    const res2 = await patchIssue(issue.id, { dueDate: null });
    const { data: d2 } = await parseResponse<IssueWithLabels>(res2);
    expect(d2.dueDate).toBeNull();
  });

  it("updates description", async () => {
    const issue = await createIssue({ title: "Desc test" });
    const res = await patchIssue(issue.id, { description: "New description" });
    const { data } = await parseResponse<IssueWithLabels>(res);
    expect(data.description).toBe("New description");
  });

  it("replaces labels (old removed, new added)", async () => {
    const l1 = "label-replace-1";
    const l2 = "label-replace-2";
    testDb.sqlite.prepare("INSERT OR IGNORE INTO labels (id, name, color, created_at, updated_at) VALUES (?, ?, '#F00', datetime('now'), datetime('now'))").run(l1, "LabelA");
    testDb.sqlite.prepare("INSERT OR IGNORE INTO labels (id, name, color, created_at, updated_at) VALUES (?, ?, '#0F0', datetime('now'), datetime('now'))").run(l2, "LabelB");

    const issue = await createIssue({ title: "Label test", labelIds: [l1] });
    expect(issue.labels).toHaveLength(1);
    expect(issue.labels[0].id).toBe(l1);

    // Replace l1 with l2
    const res = await patchIssue(issue.id, { labelIds: [l2] });
    const { data } = await parseResponse<IssueWithLabels>(res);
    expect(data.labels).toHaveLength(1);
    expect(data.labels[0].id).toBe(l2);
  });

  it("sets parentId → valid parent", async () => {
    const parent = await createIssue({ title: "Parent" });
    const child = await createIssue({ title: "Child" });
    const res = await patchIssue(child.id, { parentId: parent.id });
    const { data } = await parseResponse<IssueWithLabels>(res);
    expect(data.parentId).toBe(parent.id);
  });

  it("rejects parentId === self", async () => {
    const issue = await createIssue({ title: "Self-parent" });
    const res = await patchIssue(issue.id, { parentId: issue.id });
    expect(res.status).toBe(400);
  });

  it("rejects parentId when issue has children", async () => {
    const parent = await createIssue({ title: "HasChildren" });
    await createIssue({ title: "Child", parentId: parent.id });
    const otherParent = await createIssue({ title: "OtherParent" });

    const res = await patchIssue(parent.id, { parentId: otherParent.id });
    expect(res.status).toBe(400);
    const { data } = await parseResponse(res);
    expect((data as { error: string }).error).toContain("sub-issues");
  });

  it("rejects parentId to an issue that already has a parent", async () => {
    const grandparent = await createIssue({ title: "Grandparent" });
    const parent = await createIssue({ title: "Parent" });
    // Make parent a child of grandparent
    await patchIssue(parent.id, { parentId: grandparent.id });

    const child = await createIssue({ title: "WouldBeGrandchild" });
    const res = await patchIssue(child.id, { parentId: parent.id });
    expect(res.status).toBe(400);
    const { data } = await parseResponse(res);
    expect((data as { error: string }).error).toContain("one level");
  });
});
