import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { GET } from "./route";
import * as db from "@/lib/db";

// Mock the database module
vi.mock("@/lib/db", () => ({
  getSqlite: vi.fn(),
}));

describe("GET /api/health", () => {
  const mockGet = vi.fn();
  const mockPrepare = vi.fn(() => ({ get: mockGet }));
  const mockSqlite = { prepare: mockPrepare };

  beforeEach(() => {
    vi.clearAllMocks();
    (db.getSqlite as Mock).mockReturnValue(mockSqlite);
  });

  it("returns 200 OK when database is healthy", async () => {
    mockGet.mockReturnValue({ ok: 1 });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "ok",
      timestamp: expect.any(String),
    });
  });

  it("returns 503 Service Unavailable when database check fails", async () => {
    mockGet.mockReturnValue({ ok: 0 });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      status: "error",
      message: "Database check failed",
    });
  });

  it("returns 503 Service Unavailable when database is unreachable", async () => {
    (db.getSqlite as Mock).mockImplementation(() => {
      throw new Error("Connection failed");
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      status: "error",
      message: "Database unreachable",
    });
  });
});
