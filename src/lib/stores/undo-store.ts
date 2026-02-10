"use client";

import { create } from "zustand";

export interface UndoEntry {
  id: string;
  actionType: "create" | "update" | "delete";
  entityType: "issue" | "project" | "label" | "comment";
  entityId: string;
  description: string;
  previousState: Record<string, unknown>;
  timestamp: number;
}

const MAX_STACK = 50;
const EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

interface UndoState {
  stack: UndoEntry[];
  pushUndo: (entry: Omit<UndoEntry, "id" | "timestamp">) => void;
  popUndo: () => UndoEntry | null;
  peekUndo: () => UndoEntry | null;
  clear: () => void;
}

let idCounter = 0;

export const useUndoStore = create<UndoState>((set, get) => ({
  stack: [],

  pushUndo: (entry) => {
    const id = `undo_${++idCounter}_${Date.now()}`;
    set((state) => ({
      stack: [
        { ...entry, id, timestamp: Date.now() },
        ...state.stack,
      ].slice(0, MAX_STACK),
    }));
  },

  popUndo: () => {
    const { stack } = get();
    const now = Date.now();
    // Find first non-expired entry
    const validIndex = stack.findIndex((e) => now - e.timestamp < EXPIRY_MS);
    if (validIndex === -1) {
      set({ stack: [] });
      return null;
    }
    const entry = stack[validIndex];
    set((state) => ({
      stack: state.stack.filter((_, i) => i !== validIndex),
    }));
    return entry;
  },

  peekUndo: () => {
    const { stack } = get();
    const now = Date.now();
    const entry = stack.find((e) => now - e.timestamp < EXPIRY_MS);
    return entry || null;
  },

  clear: () => set({ stack: [] }),
}));
