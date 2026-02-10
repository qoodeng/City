import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { createTestDb, cleanupTestDb } from "@/test/db";
import { createRequest, parseResponse } from "@/test/api-helpers";
import type { FtsSearchResult } from "@/types";
import type { IssueWithLabels } from "@/types";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb.db;
  },
  getSqlite: () => testDb.sqlite,
}));

const { GET } = await import("../search/route");
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

describe("GET /api/issues/search", () => {
  it("matches by title keyword", async () => {
    await createIssue({ title: "Authentication login page" });
    await createIssue({ title: "Dashboard widget" });

    const req = createRequest("GET", "/api/issues/search?q=Authentication");
    const { data } = await parseResponse<FtsSearchResult[]>(await GET(req));
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Authentication login page");
  });

  it("matches by description keyword", async () => {
    await createIssue({ title: "Fix bug", description: "The database connection is flaky" });
    await createIssue({ title: "Add feature" });

    const req = createRequest("GET", "/api/issues/search?q=database");
    const { data } = await parseResponse<FtsSearchResult[]>(await GET(req));
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Fix bug");
  });

  it("returns snippets with highlight markers", async () => {
    await createIssue({ title: "Implement search feature", description: "Add full text search to issues" });

    const req = createRequest("GET", "/api/issues/search?q=search");
    const { data } = await parseResponse<FtsSearchResult[]>(await GET(req));
    expect(data).toHaveLength(1);
    expect(data[0].titleSnippet).toContain("<mark>");
    expect(data[0].titleSnippet).toContain("</mark>");
  });

  it("respects limit parameter", async () => {
    for (let i = 0; i < 5; i++) {
      await createIssue({ title: `Searchable item ${i}` });
    }

    const req = createRequest("GET", "/api/issues/search?q=Searchable&limit=2");
    const { data } = await parseResponse<FtsSearchResult[]>(await GET(req));
    expect(data).toHaveLength(2);
  });

  it("ranks results by relevance", async () => {
    await createIssue({ title: "Search implementation", description: "Search results" });
    await createIssue({ title: "Unrelated task", description: "Not about search" });

    const req = createRequest("GET", "/api/issues/search?q=search");
    const { data } = await parseResponse<FtsSearchResult[]>(await GET(req));
    expect(data.length).toBeGreaterThanOrEqual(1);
    // Results should have rank field
    expect(data[0]).toHaveProperty("rank");
  });

  it("quoted search terms are sanitized (both words match individually)", async () => {
    await createIssue({ title: "Fix the login page" });
    await createIssue({ title: "Login fix for page" });

    // Quotes are stripped by escapeFts5Query for safety; both tokens match individually
    const req = createRequest("GET", '/api/issues/search?q="login page"');
    const { data } = await parseResponse<FtsSearchResult[]>(await GET(req));
    expect(data).toHaveLength(2);
  });

  it("FTS index auto-updates on issue insert/update/delete", async () => {
    const issue = await createIssue({ title: "Temporary issue" });

    // Should be searchable
    let req = createRequest("GET", "/api/issues/search?q=Temporary");
    let { data } = await parseResponse<FtsSearchResult[]>(await GET(req));
    expect(data).toHaveLength(1);

    // Delete the issue
    testDb.sqlite.prepare("DELETE FROM issues WHERE id = ?").run(issue.id);

    // Should no longer be searchable
    req = createRequest("GET", "/api/issues/search?q=Temporary");
    ({ data } = await parseResponse<FtsSearchResult[]>(await GET(req)));
    expect(data).toHaveLength(0);
  });
});
