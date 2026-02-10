"use client";

import { create } from "zustand";

interface KeyboardState {
  keyBuffer: string[];
  bufferTimeout: ReturnType<typeof setTimeout> | null;
  lastAction: (() => void) | null;
  lastActionDescription: string | null;
  pushKey: (key: string) => string[];
  clearBuffer: () => void;
  setLastAction: (action: () => void, description: string) => void;
  repeatLastAction: () => void;
}

export const useKeyboardStore = create<KeyboardState>((set, get) => ({
  keyBuffer: [],
  bufferTimeout: null,
  lastAction: null,
  lastActionDescription: null,

  pushKey: (key: string) => {
    const { bufferTimeout } = get();
    if (bufferTimeout) clearTimeout(bufferTimeout);

    const newBuffer = [...get().keyBuffer, key];

    const timeout = setTimeout(() => {
      set({ keyBuffer: [], bufferTimeout: null });
    }, 500);

    set({ keyBuffer: newBuffer, bufferTimeout: timeout });
    return newBuffer;
  },

  clearBuffer: () => {
    const { bufferTimeout } = get();
    if (bufferTimeout) clearTimeout(bufferTimeout);
    set({ keyBuffer: [], bufferTimeout: null });
  },

  setLastAction: (action, description) => {
    set({ lastAction: action, lastActionDescription: description });
  },

  repeatLastAction: () => {
    const { lastAction } = get();
    if (lastAction) lastAction();
  },
}));
