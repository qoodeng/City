import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../ui-store";

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      createIssueDialogOpen: false,
      createIssueParentId: null,
      viewMode: "list",
      selectedIssueIds: new Set(),
      focusedIssueId: null,
      inlinePicker: null,
    });
  });

  it("toggleSidebar toggles collapsed state", () => {
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it("set/clear focused issue ID", () => {
    useUIStore.getState().setFocusedIssueId("issue-1");
    expect(useUIStore.getState().focusedIssueId).toBe("issue-1");
    useUIStore.getState().setFocusedIssueId(null);
    expect(useUIStore.getState().focusedIssueId).toBeNull();
  });

  it("set/clear selected issue IDs (multi-select)", () => {
    useUIStore.getState().selectAllIssues(["a", "b", "c"]);
    expect(useUIStore.getState().selectedIssueIds.size).toBe(3);
    useUIStore.getState().clearSelection();
    expect(useUIStore.getState().selectedIssueIds.size).toBe(0);
  });

  it("toggleIssueSelection adds and removes", () => {
    useUIStore.getState().toggleIssueSelection("a");
    expect(useUIStore.getState().selectedIssueIds.has("a")).toBe(true);
    useUIStore.getState().toggleIssueSelection("a");
    expect(useUIStore.getState().selectedIssueIds.has("a")).toBe(false);
  });

  it("set view mode (list/board)", () => {
    useUIStore.getState().setViewMode("board");
    expect(useUIStore.getState().viewMode).toBe("board");
    useUIStore.getState().setViewMode("list");
    expect(useUIStore.getState().viewMode).toBe("list");
  });

  it("toggle command palette", () => {
    useUIStore.getState().setCommandPaletteOpen(true);
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
    useUIStore.getState().setCommandPaletteOpen(false);
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it("toggle create issue dialog", () => {
    useUIStore.getState().setCreateIssueDialogOpen(true);
    expect(useUIStore.getState().createIssueDialogOpen).toBe(true);
    useUIStore.getState().setCreateIssueDialogOpen(false);
    expect(useUIStore.getState().createIssueDialogOpen).toBe(false);
  });

  it("createIssueParentId set/clear", () => {
    useUIStore.getState().setCreateIssueParentId("parent-1");
    expect(useUIStore.getState().createIssueParentId).toBe("parent-1");
    useUIStore.getState().setCreateIssueParentId(null);
    expect(useUIStore.getState().createIssueParentId).toBeNull();
  });

  it("inlinePicker set/clear", () => {
    useUIStore
      .getState()
      .setInlinePicker({ type: "status", issueId: "issue-1" });
    expect(useUIStore.getState().inlinePicker).toEqual({
      type: "status",
      issueId: "issue-1",
    });
    useUIStore.getState().setInlinePicker(null);
    expect(useUIStore.getState().inlinePicker).toBeNull();
  });
});
