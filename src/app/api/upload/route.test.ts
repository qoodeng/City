import { POST } from "./route";
import { NextRequest } from "next/server";
import { vi, describe, it, expect, beforeEach } from "vitest";
import fs from "fs/promises";

// Mock fs/promises
vi.mock("fs/promises", () => ({
  default: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
  },
}));

// Mock DB
vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "test-attachment-id" }]),
      }),
    }),
  },
}));

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: () => "test-id",
}));

describe("Upload API Path Traversal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prevents path traversal in issueId", async () => {
    // Create a dummy file
    const file = new File(["dummy content"], "test.txt", { type: "text/plain" });

    // Create FormData with malicious issueId
    const formData = new FormData();
    formData.append("file", file);
    // traversing up twice to escape 'uploads' folder
    const maliciousIssueId = "../../etc";
    formData.append("issueId", maliciousIssueId);

    // Create Request
    const req = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    // Call the handler
    const response = await POST(req);

    // Verify rejection
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid issueId");

    // Verify mkdir was NOT called
    expect(fs.mkdir).not.toHaveBeenCalled();
  });
});
