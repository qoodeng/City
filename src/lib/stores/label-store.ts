"use client";

import { create } from "zustand";
import type { Label } from "@/lib/db/schema";
import { useUndoStore } from "./undo-store";
import { useSyncStore } from "./sync-store";
import { toast } from "sonner";

interface LabelState {
  labels: Label[];
  loading: boolean;

  fetchLabels: () => Promise<void>;
  createLabel: (data: Record<string, unknown>) => Promise<Label | null>;
  updateLabel: (
    id: string,
    data: Record<string, unknown>
  ) => Promise<boolean>;
  deleteLabel: (id: string) => Promise<boolean>;
}

export const useLabelStore = create<LabelState>((set, get) => ({
  labels: [],
  loading: false,

  fetchLabels: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/labels");
      if (res.ok) {
        const data = await res.json();
        set({ labels: data });
      }
    } finally {
      set({ loading: false });
    }
  },

  createLabel: async (data) => {
    const sync = useSyncStore.getState();
    sync.increment();
    try {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const label = await res.json();
        set((state) => ({ labels: [...state.labels, label] }));
        useUndoStore.getState().pushUndo({
          actionType: "create",
          entityType: "label",
          entityId: label.id,
          description: `Created label "${label.name}"`,
          previousState: {},
        });
        sync.decrement();
        return label;
      }
      sync.decrement();
      toast.error("Failed to create label");
      return null;
    } catch {
      sync.decrement();
      toast.error("Failed to create label");
      return null;
    }
  },

  updateLabel: async (id, data) => {
    const prev = get().labels;
    const prevLabel = prev.find((l) => l.id === id);

    // Capture undo data before update (pushed only on API success)
    let undoFields: Record<string, unknown> | null = null;
    if (prevLabel) {
      undoFields = {};
      for (const key of Object.keys(data)) {
        undoFields[key] = (prevLabel as Record<string, unknown>)[key];
      }
    }

    // Optimistic update
    set((state) => ({
      labels: state.labels.map((l) =>
        l.id === id ? { ...l, ...data } : l
      ),
    }));

    const sync = useSyncStore.getState();
    sync.increment();

    try {
      const res = await fetch(`/api/labels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          labels: state.labels.map((l) => (l.id === id ? updated : l)),
        }));
        if (undoFields && prevLabel) {
          useUndoStore.getState().pushUndo({
            actionType: "update",
            entityType: "label",
            entityId: id,
            description: `Updated label "${prevLabel.name}"`,
            previousState: undoFields,
          });
        }
        sync.decrement();
        return true;
      }
      set({ labels: prev });
      sync.decrement();
      toast.error("Failed to update label");
      return false;
    } catch {
      set({ labels: prev });
      sync.decrement();
      toast.error("Failed to update label");
      return false;
    }
  },

  deleteLabel: async (id) => {
    const prev = get().labels;
    const labelToDelete = prev.find((l) => l.id === id);

    // Optimistic delete (undo pushed only on API success)
    set((state) => ({
      labels: state.labels.filter((l) => l.id !== id),
    }));

    const sync = useSyncStore.getState();
    sync.increment();

    try {
      const res = await fetch(`/api/labels/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (labelToDelete) {
          useUndoStore.getState().pushUndo({
            actionType: "delete",
            entityType: "label",
            entityId: id,
            description: `label "${labelToDelete.name}"`,
            previousState: { ...labelToDelete },
          });
        }
        sync.decrement();
        return true;
      }
      set({ labels: prev });
      sync.decrement();
      toast.error("Failed to delete label");
      return false;
    } catch {
      set({ labels: prev });
      sync.decrement();
      toast.error("Failed to delete label");
      return false;
    }
  },
}));
