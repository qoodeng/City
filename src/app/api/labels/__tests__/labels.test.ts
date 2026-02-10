import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { createTestDb, cleanupTestDb } from "@/test/db";
import { createRequest, createParams, parseResponse } from "@/test/api-helpers";
import type { Label } from "@/lib/db/schema";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb.db;
  },
  getSqlite: () => testDb.sqlite,
}));

const { GET, POST } = await import("../route");
const { PATCH, DELETE } = await import("../[labelId]/route");
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
  testDb.sqlite.prepare("DELETE FROM labels").run();
});

async function createLabel(body: Record<string, unknown>) {
  const req = createRequest("POST", "/api/labels", body);
  const res = await POST(req);
  return parseResponse<Label>(res);
}

describe("Labels CRUD", () => {
  it("POST — creates label with name and color", async () => {
    const { data, status } = await createLabel({ name: "Bug", color: "#EF4444" });
    expect(status).toBe(201);
    expect(data.name).toBe("Bug");
    expect(data.color).toBe("#EF4444");
  });

  it("POST — rejects duplicate name → 500 (unique constraint)", async () => {
    await createLabel({ name: "Unique" });
    const { status } = await createLabel({ name: "Unique" });
    expect(status).toBe(500);
  });

  it("GET — returns all labels", async () => {
    await createLabel({ name: "Bug" });
    await createLabel({ name: "Feature" });

    const res = await GET();
    const { data } = await parseResponse<Label[]>(res);
    expect(data).toHaveLength(2);
  });

  it("PATCH — updates name, color, description", async () => {
    const { data: label } = await createLabel({ name: "OldName" });

    const req = createRequest("PATCH", `/api/labels/${label.id}`, {
      name: "NewName",
      color: "#00FF00",
      description: "Updated description",
    });
    const res = await PATCH(req, createParams({ labelId: label.id }));
    const { data } = await parseResponse<Label>(res);
    expect(data.name).toBe("NewName");
    expect(data.color).toBe("#00FF00");
    expect(data.description).toBe("Updated description");
  });

  it("PATCH — non-existent label → 404", async () => {
    const req = createRequest("PATCH", "/api/labels/nonexistent", { name: "X" });
    const res = await PATCH(req, createParams({ labelId: "nonexistent" }));
    expect(res.status).toBe(404);
  });

  it("DELETE — deletes label, cascades junction rows", async () => {
    const { data: label } = await createLabel({ name: "ToDelete" });

    // Create an issue with this label
    testDb.sqlite.prepare("INSERT INTO issues (id, number, title, status, priority, sort_order, created_at, updated_at) VALUES ('issue-for-label', 1, 'Test', 'backlog', 'none', 0, datetime('now'), datetime('now'))").run();
    testDb.sqlite.prepare("INSERT INTO issue_labels (issue_id, label_id) VALUES ('issue-for-label', ?)").run(label.id);

    const req = createRequest("DELETE", `/api/labels/${label.id}`);
    const res = await DELETE(req, createParams({ labelId: label.id }));
    expect(res.status).toBe(200);

    // Verify junction rows are gone
    const cnt = testDb.sqlite.prepare("SELECT count(*) as cnt FROM issue_labels WHERE label_id = ?").get(label.id) as { cnt: number };
    expect(cnt.cnt).toBe(0);
  });

  it("DELETE — non-existent label returns 404", async () => {
    const req = createRequest("DELETE", "/api/labels/nonexistent");
    const res = await DELETE(req, createParams({ labelId: "nonexistent" }));
    expect(res.status).toBe(404);
  });

  it("Restore — recreates with explicit ID", async () => {
    const req = createRequest("POST", "/api/labels/restore", {
      id: "restored-label-1",
      name: "RestoredBug",
      color: "#EF4444",
    });
    const res = await POST_RESTORE(req);
    const { data, status } = await parseResponse<Label>(res);
    expect(status).toBe(201);
    expect(data.id).toBe("restored-label-1");
    expect(data.name).toBe("RestoredBug");
  });
});
