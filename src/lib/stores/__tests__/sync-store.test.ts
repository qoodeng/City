import { describe, it, expect, beforeEach } from "vitest";
import { useSyncStore } from "../sync-store";

describe("useSyncStore", () => {
  beforeEach(() => {
    useSyncStore.setState({ pendingCount: 0, lastError: null });
  });

  it("has correct initial state", () => {
    const state = useSyncStore.getState();
    expect(state.pendingCount).toBe(0);
    expect(state.lastError).toBeNull();
  });

  it("increment increases count", () => {
    useSyncStore.getState().increment();
    expect(useSyncStore.getState().pendingCount).toBe(1);
    useSyncStore.getState().increment();
    expect(useSyncStore.getState().pendingCount).toBe(2);
  });

  it("decrement decreases count and never goes below 0", () => {
    useSyncStore.getState().increment();
    useSyncStore.getState().increment();
    useSyncStore.getState().decrement();
    expect(useSyncStore.getState().pendingCount).toBe(1);
    useSyncStore.getState().decrement();
    useSyncStore.getState().decrement(); // Should not go negative
    expect(useSyncStore.getState().pendingCount).toBe(0);
  });

  it("setError sets error message", () => {
    useSyncStore.getState().setError("Network error");
    expect(useSyncStore.getState().lastError).toBe("Network error");
  });

  it("setError(null) clears error", () => {
    useSyncStore.getState().setError("Some error");
    useSyncStore.getState().setError(null);
    expect(useSyncStore.getState().lastError).toBeNull();
  });
});
