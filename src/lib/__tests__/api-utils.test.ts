import { describe, it, expect } from "vitest";
import { generateId, jsonResponse, errorResponse } from "../api-utils";

describe("api-utils", () => {
  it("generateId returns a 21-char nanoid string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBe(21);
  });

  it("generateId returns unique values", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("jsonResponse returns NextResponse with JSON body and correct status", async () => {
    const res = jsonResponse({ hello: "world" }, 201);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toEqual({ hello: "world" });
  });

  it("errorResponse returns NextResponse with error message and status", async () => {
    const res = errorResponse("Something broke", 500);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toEqual({ error: "Something broke" });
  });
});
