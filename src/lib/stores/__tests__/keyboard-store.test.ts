import { describe, it, expect, beforeEach, vi } from "vitest";
import { useKeyboardStore } from "../keyboard-store";

describe("useKeyboardStore", () => {
  beforeEach(() => {
    vi.useRealTimers();
    useKeyboardStore.setState({
      keyBuffer: [],
      bufferTimeout: null,
      lastAction: null,
      lastActionDescription: null,
    });
  });

  it("pushKey adds to buffer", () => {
    const buffer = useKeyboardStore.getState().pushKey("g");
    expect(buffer).toEqual(["g"]);
    expect(useKeyboardStore.getState().keyBuffer).toEqual(["g"]);
  });

  it("buffer clears after 500ms timeout", () => {
    vi.useFakeTimers();
    useKeyboardStore.getState().pushKey("g");
    expect(useKeyboardStore.getState().keyBuffer).toEqual(["g"]);

    vi.advanceTimersByTime(500);
    expect(useKeyboardStore.getState().keyBuffer).toEqual([]);
  });

  it("clearBuffer resets immediately", () => {
    useKeyboardStore.getState().pushKey("g");
    useKeyboardStore.getState().clearBuffer();
    expect(useKeyboardStore.getState().keyBuffer).toEqual([]);
  });

  it("setLastAction stores action and description", () => {
    const action = vi.fn();
    useKeyboardStore.getState().setLastAction(action, "Mark done");
    expect(useKeyboardStore.getState().lastAction).toBe(action);
    expect(useKeyboardStore.getState().lastActionDescription).toBe("Mark done");
  });

  it("repeatLastAction calls stored action", () => {
    const action = vi.fn();
    useKeyboardStore.getState().setLastAction(action, "Mark done");
    useKeyboardStore.getState().repeatLastAction();
    expect(action).toHaveBeenCalledOnce();
  });

  it("repeatLastAction is no-op when no last action", () => {
    // Should not throw
    useKeyboardStore.getState().repeatLastAction();
    expect(useKeyboardStore.getState().lastAction).toBeNull();
  });

  it("multi-key sequence within 500ms builds buffer", () => {
    vi.useFakeTimers();
    useKeyboardStore.getState().pushKey("g");
    vi.advanceTimersByTime(200);
    const buffer = useKeyboardStore.getState().pushKey("g");
    expect(buffer).toEqual(["g", "g"]);
    expect(useKeyboardStore.getState().keyBuffer).toEqual(["g", "g"]);
  });
});
