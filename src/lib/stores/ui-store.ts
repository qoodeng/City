"use client";

import { create } from "zustand";
import type { ViewMode } from "@/types";

type InlinePicker = {
  type: "status" | "priority" | "label" | "project";
  issueId: string;
} | null;

interface UIState {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  createIssueDialogOpen: boolean;
  createIssueParentId: string | null;
  viewMode: ViewMode;
  selectedIssueIds: Set<string>;
  focusedIssueId: string | null;
  inlinePicker: InlinePicker;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setCreateIssueDialogOpen: (open: boolean) => void;
  setCreateIssueParentId: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleIssueSelection: (id: string) => void;
  selectAllIssues: (ids: string[]) => void;
  clearSelection: () => void;
  setFocusedIssueId: (id: string | null) => void;
  setInlinePicker: (picker: InlinePicker) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  createIssueDialogOpen: false,
  createIssueParentId: null,
  viewMode: "list",
  selectedIssueIds: new Set<string>(),
  focusedIssueId: null,
  inlinePicker: null,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setCreateIssueDialogOpen: (open) => set({ createIssueDialogOpen: open }),
  setCreateIssueParentId: (id) => set({ createIssueParentId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleIssueSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedIssueIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedIssueIds: next };
    }),
  selectAllIssues: (ids) => set({ selectedIssueIds: new Set(ids) }),
  clearSelection: () => set({ selectedIssueIds: new Set() }),
  setFocusedIssueId: (id) => set({ focusedIssueId: id }),
  setInlinePicker: (picker) => set({ inlinePicker: picker }),
}));
