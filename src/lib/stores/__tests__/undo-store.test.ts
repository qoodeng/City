import { describe, it, expect, beforeEach, vi } from "vitest";
import { useUndoStore } from "../undo-store";

describe("useUndoStore", () => {
  beforeEach(() => {
    useUndoStore.setState({ stack: [] });
  });

  const makeEntry = (overrides = {}) => ({
    actionType: "delete" as const,
    entityType: "issue" as const,
    entityId: "test-id",
    description: "Test entry",
    previousState: { title: "Test" },
    ...overrides,
  });

  it("pushUndo adds entry to stack", () => {
    useUndoStore.getState().pushUndo(makeEntry());
    expect(useUndoStore.getState().stack).toHaveLength(1);
    expect(useUndoStore.getState().stack[0].description).toBe("Test entry");
  });

  it("pushUndo caps stack at 50 entries", () => {
    for (let i = 0; i < 55; i++) {
      useUndoStore.getState().pushUndo(makeEntry({ entityId: `id-${i}` }));
    }
    expect(useUndoStore.getState().stack).toHaveLength(50);
  });

  it("popUndo returns most recent non-expired entry", () => {
    useUndoStore.getState().pushUndo(makeEntry({ description: "first" }));
    useUndoStore.getState().pushUndo(makeEntry({ description: "second" }));
    const entry = useUndoStore.getState().popUndo();
    expect(entry?.description).toBe("second");
    expect(useUndoStore.getState().stack).toHaveLength(1);
  });

  it("popUndo skips expired entries", () => {
    vi.useFakeTimers();
    useUndoStore.getState().pushUndo(makeEntry({ description: "old" }));
    // Advance past expiry (10 minutes)
    vi.advanceTimersByTime(11 * 60 * 1000);
    const entry = useUndoStore.getState().popUndo();
    expect(entry).toBeNull();
    expect(useUndoStore.getState().stack).toHaveLength(0);
    vi.useRealTimers();
  });

  it("popUndo returns null on empty stack", () => {
    const entry = useUndoStore.getState().popUndo();
    expect(entry).toBeNull();
  });

  it("peekUndo returns entry without removing it", () => {
    useUndoStore.getState().pushUndo(makeEntry());
    const entry = useUndoStore.getState().peekUndo();
    expect(entry).not.toBeNull();
    expect(useUndoStore.getState().stack).toHaveLength(1);
  });

  it("peekUndo skips expired entries", () => {
    vi.useFakeTimers();
    useUndoStore.getState().pushUndo(makeEntry());
    vi.advanceTimersByTime(11 * 60 * 1000);
    const entry = useUndoStore.getState().peekUndo();
    expect(entry).toBeNull();
    vi.useRealTimers();
  });

  it("clear empties the entire stack", () => {
    useUndoStore.getState().pushUndo(makeEntry());
    useUndoStore.getState().pushUndo(makeEntry());
    useUndoStore.getState().clear();
    expect(useUndoStore.getState().stack).toHaveLength(0);
  });

  it("entries have auto-generated id and timestamp", () => {
    useUndoStore.getState().pushUndo(makeEntry());
    const entry = useUndoStore.getState().stack[0];
    expect(entry.id).toMatch(/^undo_/);
    expect(entry.timestamp).toBeGreaterThan(0);
  });

  it("multiple push/pop cycle maintains LIFO order", () => {
    useUndoStore.getState().pushUndo(makeEntry({ description: "A" }));
    useUndoStore.getState().pushUndo(makeEntry({ description: "B" }));
    useUndoStore.getState().pushUndo(makeEntry({ description: "C" }));

    expect(useUndoStore.getState().popUndo()?.description).toBe("C");
    expect(useUndoStore.getState().popUndo()?.description).toBe("B");
    expect(useUndoStore.getState().popUndo()?.description).toBe("A");
    expect(useUndoStore.getState().popUndo()).toBeNull();
  });
});
