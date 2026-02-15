import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { createTestDb, cleanupTestDb } from "@/test/db";
import { createRequest } from "@/test/api-helpers";
import { attachments, issues } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

let testDb: ReturnType<typeof createTestDb>;

// Mock Dependencies
vi.mock("@/lib/db", () => ({
  get db() {
    return testDb.db;
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockReadFile = vi.fn();
const mockUnlink = vi.fn();

vi.mock("fs/promises", () => ({
  default: {
    readFile: (...args: unknown[]) => mockReadFile(...args),
    unlink: (...args: unknown[]) => mockUnlink(...args),
  },
}));

// Import Handler
const { GET, DELETE } = await import("../[id]/route");

describe("Attachments API", () => {
  beforeAll(() => {
    testDb = createTestDb();
  });

  afterAll(() => {
    cleanupTestDb(testDb);
  });

  beforeEach(() => {
    // Clear tables
    testDb.sqlite.prepare("DELETE FROM attachments").run();
    testDb.sqlite.prepare("DELETE FROM issues").run();
    testDb.sqlite.prepare("DELETE FROM projects").run();

    vi.clearAllMocks();
    mockReadFile.mockReset();
    mockUnlink.mockReset();
  });

  // Helper to setup data
  const setupAttachment = () => {
    const issueId = "issue-1";
    const attachmentId = "att-1";
    const filepath = "/uploads/test.png";
    const fileContent = Buffer.from("fake-image-content");

    testDb.db.insert(issues).values({
      id: issueId,
      number: 1,
      title: "Test Issue",
    }).run();

    testDb.db.insert(attachments).values({
      id: attachmentId,
      issueId: issueId,
      filename: "test.png",
      filepath: filepath,
      mimeType: "image/png",
      size: 1024,
    }).run();

    return { issueId, attachmentId, filepath, fileContent };
  };

  describe("GET /api/attachments/[id]", () => {
    it("returns file content with correct headers when found", async () => {
      const { attachmentId, filepath, fileContent } = setupAttachment();
      mockReadFile.mockResolvedValue(fileContent);

      const req = createRequest("GET", `/api/attachments/${attachmentId}`);
      const res = await GET(req, { params: Promise.resolve({ id: attachmentId }) });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("image/png");
      expect(res.headers.get("Content-Disposition")).toContain('filename="test.png"');

      const buffer = await res.arrayBuffer();
      expect(Buffer.from(buffer)).toEqual(fileContent);
      expect(mockReadFile).toHaveBeenCalledWith(filepath);
    });

    it("returns 404 when attachment ID not in DB", async () => {
      const req = createRequest("GET", "/api/attachments/non-existent");
      const res = await GET(req, { params: Promise.resolve({ id: "non-existent" }) });
      expect(res.status).toBe(404);
      expect(mockReadFile).not.toHaveBeenCalled();
    });

    it("returns 404 when file missing on disk", async () => {
      const { attachmentId, filepath } = setupAttachment();
      mockReadFile.mockRejectedValue(new Error("ENOENT"));

      const req = createRequest("GET", `/api/attachments/${attachmentId}`);
      const res = await GET(req, { params: Promise.resolve({ id: attachmentId }) });

      expect(res.status).toBe(404);
      expect(await res.text()).toBe("File not found on disk");
      expect(mockReadFile).toHaveBeenCalledWith(filepath);
    });

    it("returns 500 on unexpected error", async () => {
       const req = createRequest("GET", "/api/attachments/error");
       const res = await GET(req, { params: Promise.reject(new Error("Simulated")) });
       expect(res.status).toBe(500);
    });
  });

  describe("DELETE /api/attachments/[id]", () => {
    it("deletes from DB and disk when found", async () => {
      const { attachmentId, filepath } = setupAttachment();
      mockUnlink.mockResolvedValue(undefined);

      const req = createRequest("DELETE", `/api/attachments/${attachmentId}`);
      const res = await DELETE(req, { params: Promise.resolve({ id: attachmentId }) });

      expect(res.status).toBe(200);

      const result = testDb.db.select().from(attachments).where(eq(attachments.id, attachmentId)).all();
      expect(result).toHaveLength(0);
      expect(mockUnlink).toHaveBeenCalledWith(filepath);
    });

    it("returns 404 when attachment ID not in DB", async () => {
      const req = createRequest("DELETE", "/api/attachments/non-existent");
      const res = await DELETE(req, { params: Promise.resolve({ id: "non-existent" }) });
      expect(res.status).toBe(404);
      expect(mockUnlink).not.toHaveBeenCalled();
    });

    it("returns 200 (best effort) when fs.unlink fails", async () => {
      const { attachmentId, filepath } = setupAttachment();
      mockUnlink.mockRejectedValue(new Error("EACCES"));

      const req = createRequest("DELETE", `/api/attachments/${attachmentId}`);
      const res = await DELETE(req, { params: Promise.resolve({ id: attachmentId }) });

      expect(res.status).toBe(200);

      const result = testDb.db.select().from(attachments).where(eq(attachments.id, attachmentId)).all();
      expect(result).toHaveLength(0);
      expect(mockUnlink).toHaveBeenCalledWith(filepath);
    });

    it("returns 500 on unexpected error", async () => {
       const req = createRequest("DELETE", "/api/attachments/error");
       const res = await DELETE(req, { params: Promise.reject(new Error("Simulated")) });
       expect(res.status).toBe(500);
    });
  });
});
