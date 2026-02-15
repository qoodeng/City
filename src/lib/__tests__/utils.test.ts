import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn", () => {
  it("merges class names correctly", () => {
    expect(cn("px-2 py-1 bg-red-500 hover:bg-red-600")).toBe(
      "px-2 py-1 bg-red-500 hover:bg-red-600"
    );
  });

  it("handles conditional classes", () => {
    expect(cn("px-2", true && "py-1", false && "bg-red-500")).toBe("px-2 py-1");
  });

  it("merges conflicting Tailwind classes", () => {
    expect(cn("px-2 px-4")).toBe("px-4");
    expect(cn("p-2 p-4")).toBe("p-4");
    expect(cn("text-red-500 text-blue-500")).toBe("text-blue-500");
  });

  it("handles arrays of classes", () => {
    expect(cn(["px-2", "py-1"])).toBe("px-2 py-1");
  });

  it("handles objects with boolean values", () => {
    expect(cn({ "px-2": true, "py-1": false })).toBe("px-2");
  });

  it("handles mixed inputs", () => {
    expect(cn("px-2", ["py-1", { "bg-red-500": true }])).toBe(
      "px-2 py-1 bg-red-500"
    );
  });

  it("handles undefined and null values", () => {
    expect(cn("px-2", undefined, null, "py-1")).toBe("px-2 py-1");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });
});
