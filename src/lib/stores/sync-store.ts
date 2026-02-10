"use client";

import { create } from "zustand";

interface SyncState {
  pendingCount: number;
  lastError: string | null;
  increment: () => void;
  decrement: () => void;
  setError: (msg: string | null) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  pendingCount: 0,
  lastError: null,

  increment: () =>
    set((state) => ({ pendingCount: state.pendingCount + 1, lastError: null })),

  decrement: () =>
    set((state) => ({ pendingCount: Math.max(0, state.pendingCount - 1) })),

  setError: (msg) => set({ lastError: msg }),
}));
