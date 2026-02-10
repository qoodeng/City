import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { createTestDb, cleanupTestDb } from "@/test/db";
import { createRequest, createParams, parseResponse } from "@/test/api-helpers";
import type { Comment } from "@/lib/db/schema";
import type { IssueWithLabels } from "@/types";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb.db;
  },
  getSqlite: () => testDb.sqlite,
}));

const { POST: POST_ISSUE } = await import("../route");
const { GET: GET_ISSUE } = await import("../[issueId]/route");
const { GET: GET_COMMENTS, POST: POST_COMMENT } = await import(
  "../[issueId]/comments/route"
);
const { PATCH: PATCH_COMMENT, DELETE: DELETE_COMMENT } = await import(
  "../[issueId]/comments/[commentId]/route"
);

beforeAll(() => {
  testDb = createTestDb();
});

afterAll(() => {
  cleanupTestDb(testDb);
});

async function createIssue(body: Record<string, unknown>) {
  const req = createRequest("POST", "/api/issues", body);
  const res = await POST_ISSUE(req);
  return parseResponse<IssueWithLabels>(res);
}

async function createComment(issueId: string, content: string) {
  const req = createRequest("POST", `/api/issues/${issueId}/comments`, {
    content,
  });
  const res = await POST_COMMENT(req, createParams({ issueId }));
  return parseResponse<Comment>(res);
}

describe("POST /api/issues/:issueId/comments", () => {
  let issueId: string;

  beforeEach(async () => {
    testDb.sqlite.prepare("DELETE FROM comments").run();
    testDb.sqlite.prepare("DELETE FROM issue_labels").run();
    testDb.sqlite.prepare("DELETE FROM issues").run();
    testDb.sqlite.prepare("UPDATE counters SET value = 0 WHERE id = 'issue_counter'").run();

    const { data } = await createIssue({ title: "Test issue for comments" });
    issueId = data.id;
  });

  it("creates a comment → returns 201", async () => {
    const { data, status } = await createComment(issueId, "<p>Hello world</p>");
    expect(status).toBe(201);
    expect(data.content).toBe("<p>Hello world</p>");
    expect(data.issueId).toBe(issueId);
    expect(data.id).toBeDefined();
    expect(data.createdAt).toBeDefined();
  });

  it("rejects empty content → 400", async () => {
    const req = createRequest("POST", `/api/issues/${issueId}/comments`, {
      content: "",
    });
    const res = await POST_COMMENT(req, createParams({ issueId }));
    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent issue", async () => {
    const req = createRequest("POST", "/api/issues/nonexistent/comments", {
      content: "test",
    });
    const res = await POST_COMMENT(req, createParams({ issueId: "nonexistent" }));
    expect(res.status).toBe(404);
  });
});

describe("GET /api/issues/:issueId/comments", () => {
  let issueId: string;

  beforeEach(async () => {
    testDb.sqlite.prepare("DELETE FROM comments").run();
    testDb.sqlite.prepare("DELETE FROM issue_labels").run();
    testDb.sqlite.prepare("DELETE FROM issues").run();
    testDb.sqlite.prepare("UPDATE counters SET value = 0 WHERE id = 'issue_counter'").run();

    const { data } = await createIssue({ title: "Test issue for comments" });
    issueId = data.id;
  });

  it("returns empty array when no comments", async () => {
    const req = createRequest("GET", `/api/issues/${issueId}/comments`);
    const res = await GET_COMMENTS(req, createParams({ issueId }));
    const { data, status } = await parseResponse<Comment[]>(res);
    expect(status).toBe(200);
    expect(data).toEqual([]);
  });

  it("returns comments ordered by createdAt ASC", async () => {
    await createComment(issueId, "<p>First</p>");
    await createComment(issueId, "<p>Second</p>");
    await createComment(issueId, "<p>Third</p>");

    const req = createRequest("GET", `/api/issues/${issueId}/comments`);
    const res = await GET_COMMENTS(req, createParams({ issueId }));
    const { data } = await parseResponse<Comment[]>(res);
    expect(data).toHaveLength(3);
    expect(data[0].content).toBe("<p>First</p>");
    expect(data[1].content).toBe("<p>Second</p>");
    expect(data[2].content).toBe("<p>Third</p>");
  });

  it("returns 404 for non-existent issue", async () => {
    const req = createRequest("GET", "/api/issues/nonexistent/comments");
    const res = await GET_COMMENTS(req, createParams({ issueId: "nonexistent" }));
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/issues/:issueId/comments/:commentId", () => {
  let issueId: string;
  let commentId: string;

  beforeEach(async () => {
    testDb.sqlite.prepare("DELETE FROM comments").run();
    testDb.sqlite.prepare("DELETE FROM issue_labels").run();
    testDb.sqlite.prepare("DELETE FROM issues").run();
    testDb.sqlite.prepare("UPDATE counters SET value = 0 WHERE id = 'issue_counter'").run();

    const { data: issue } = await createIssue({ title: "Test issue" });
    issueId = issue.id;
    const { data: comment } = await createComment(issueId, "<p>Original</p>");
    commentId = comment.id;
  });

  it("updates comment content", async () => {
    const req = createRequest(
      "PATCH",
      `/api/issues/${issueId}/comments/${commentId}`,
      { content: "<p>Updated</p>" }
    );
    const res = await PATCH_COMMENT(
      req,
      createParams({ issueId, commentId })
    );
    const { data, status } = await parseResponse<Comment>(res);
    expect(status).toBe(200);
    expect(data.content).toBe("<p>Updated</p>");
  });

  it("returns 404 for non-existent comment", async () => {
    const req = createRequest(
      "PATCH",
      `/api/issues/${issueId}/comments/nonexistent`,
      { content: "<p>Updated</p>" }
    );
    const res = await PATCH_COMMENT(
      req,
      createParams({ issueId, commentId: "nonexistent" })
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/issues/:issueId/comments/:commentId", () => {
  let issueId: string;
  let commentId: string;

  beforeEach(async () => {
    testDb.sqlite.prepare("DELETE FROM comments").run();
    testDb.sqlite.prepare("DELETE FROM issue_labels").run();
    testDb.sqlite.prepare("DELETE FROM issues").run();
    testDb.sqlite.prepare("UPDATE counters SET value = 0 WHERE id = 'issue_counter'").run();

    const { data: issue } = await createIssue({ title: "Test issue" });
    issueId = issue.id;
    const { data: comment } = await createComment(issueId, "<p>To delete</p>");
    commentId = comment.id;
  });

  it("deletes a comment", async () => {
    const req = createRequest(
      "DELETE",
      `/api/issues/${issueId}/comments/${commentId}`
    );
    const res = await DELETE_COMMENT(
      req,
      createParams({ issueId, commentId })
    );
    expect(res.status).toBe(200);

    // Verify it's gone
    const getReq = createRequest("GET", `/api/issues/${issueId}/comments`);
    const getRes = await GET_COMMENTS(getReq, createParams({ issueId }));
    const { data } = await parseResponse<Comment[]>(getRes);
    expect(data).toHaveLength(0);
  });

  it("returns 404 for non-existent comment", async () => {
    const req = createRequest(
      "DELETE",
      `/api/issues/${issueId}/comments/nonexistent`
    );
    const res = await DELETE_COMMENT(
      req,
      createParams({ issueId, commentId: "nonexistent" })
    );
    expect(res.status).toBe(404);
  });
});

describe("Cascade delete", () => {
  it("deletes comments when issue is deleted", async () => {
    testDb.sqlite.prepare("DELETE FROM comments").run();
    testDb.sqlite.prepare("DELETE FROM issue_labels").run();
    testDb.sqlite.prepare("DELETE FROM issues").run();
    testDb.sqlite.prepare("UPDATE counters SET value = 0 WHERE id = 'issue_counter'").run();

    const { data: issue } = await createIssue({ title: "Issue to delete" });
    await createComment(issue.id, "<p>Comment 1</p>");
    await createComment(issue.id, "<p>Comment 2</p>");

    // Verify comments exist
    const count = testDb.sqlite
      .prepare("SELECT COUNT(*) as count FROM comments WHERE issue_id = ?")
      .get(issue.id) as { count: number };
    expect(count.count).toBe(2);

    // Delete the issue
    testDb.sqlite.prepare("DELETE FROM issues WHERE id = ?").run(issue.id);

    // Verify comments are cascaded
    const afterCount = testDb.sqlite
      .prepare("SELECT COUNT(*) as count FROM comments WHERE issue_id = ?")
      .get(issue.id) as { count: number };
    expect(afterCount.count).toBe(0);
  });
});

describe("Comment count enrichment", () => {
  it("includes commentCount in single-issue GET", async () => {
    testDb.sqlite.prepare("DELETE FROM comments").run();
    testDb.sqlite.prepare("DELETE FROM issue_labels").run();
    testDb.sqlite.prepare("DELETE FROM issues").run();
    testDb.sqlite.prepare("UPDATE counters SET value = 0 WHERE id = 'issue_counter'").run();

    const { data: issue } = await createIssue({ title: "Issue with comments" });
    await createComment(issue.id, "<p>Comment 1</p>");
    await createComment(issue.id, "<p>Comment 2</p>");

    const req = createRequest("GET", `/api/issues/${issue.id}`);
    const res = await GET_ISSUE(req, createParams({ issueId: issue.id }));
    const { data } = await parseResponse<IssueWithLabels>(res);
    expect(data.commentCount).toBe(2);
  });
});
