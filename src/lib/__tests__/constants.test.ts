import { describe, it, expect } from "vitest";
import {
  STATUSES,
  STATUS_CONFIG,
  PRIORITIES,
  PRIORITY_CONFIG,
} from "../constants";

describe("constants", () => {
  it("STATUSES array contains all expected values", () => {
    expect(STATUSES).toEqual([
      "backlog",
      "todo",
      "in_progress",
      "done",
      "cancelled",
    ]);
  });

  it("PRIORITIES array contains all expected values", () => {
    expect(PRIORITIES).toEqual(["urgent", "high", "medium", "low", "none"]);
  });

  it("STATUS_CONFIG has label and color for each status", () => {
    for (const status of STATUSES) {
      const config = STATUS_CONFIG[status];
      expect(config).toBeDefined();
      expect(config.label).toBeTruthy();
      expect(config.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(config.icon).toBeTruthy();
    }
  });

  it("PRIORITY_CONFIG has label, icon, and order for each priority", () => {
    for (const priority of PRIORITIES) {
      const config = PRIORITY_CONFIG[priority];
      expect(config).toBeDefined();
      expect(config.label).toBeTruthy();
      expect(config.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(config.icon).toBeTruthy();
      expect(typeof config.order).toBe("number");
    }
  });
});
