"use client";

import { create } from "zustand";
import type { IssueWithLabels } from "@/types";
import { useUndoStore } from "./undo-store";
import { useSyncStore } from "./sync-store";
import { toast } from "sonner";

interface IssueState {
  issues: IssueWithLabels[];
  loading: boolean;

  fetchIssues: (params?: Record<string, string>) => Promise<void>;
  createIssue: (
    data: Record<string, unknown>
  ) => Promise<IssueWithLabels | null>;
  updateIssue: (
    id: string,
    data: Record<string, unknown>
  ) => Promise<boolean>;
  batchUpdateIssues: (
    ids: string[],
    data: Record<string, unknown>
  ) => Promise<boolean>;
  deleteIssue: (id: string) => Promise<boolean>;
  batchDeleteIssues: (ids: string[]) => Promise<boolean>;
  setIssues: (issues: IssueWithLabels[]) => void;
  navigationIds: string[];
  setNavigationIds: (ids: string[]) => void;
}

export const useIssueStore = create<IssueState>((set, get) => ({
  issues: [],
  loading: false,

  fetchIssues: async (params) => {
    set({ loading: true });
    try {
      const searchParams = new URLSearchParams(params);
      const res = await fetch(`/api/issues?${searchParams}`);
      if (res.ok) {
        const data = await res.json();
        set({ issues: data });
      }
    } finally {
      set({ loading: false });
    }
  },

  createIssue: async (data) => {
    const sync = useSyncStore.getState();
    sync.increment();
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const issue = await res.json();
        set((state) => ({ issues: [issue, ...state.issues] }));
        // Push undo entry for create (so Cmd+Z can delete it)
        useUndoStore.getState().pushUndo({
          actionType: "create",
          entityType: "issue",
          entityId: issue.id,
          description: `Created City-${issue.number}`,
          previousState: {},
        });
        sync.decrement();
        return issue;
      }
      sync.decrement();
      toast.error("Failed to create issue");
      return null;
    } catch {
      sync.decrement();
      toast.error("Failed to create issue");
      return null;
    }
  },

  updateIssue: async (id, data) => {
    const prev = get().issues;
    const prevIssue = prev.find((i) => i.id === id);

    // Capture undo data before update (pushed only on API success)
    let undoFields: Record<string, unknown> | null = null;
    if (prevIssue) {
      undoFields = {};
      for (const key of Object.keys(data)) {
        undoFields[key] = (prevIssue as Record<string, unknown>)[key];
      }
      if ("labelIds" in data && prevIssue.labels) {
        undoFields.labelIds = prevIssue.labels.map((l) => l.id);
      }
    }

    // Optimistic update
    set((state) => ({
      issues: state.issues.map((issue) =>
        issue.id === id ? { ...issue, ...data } : issue
      ),
    }));

    const sync = useSyncStore.getState();
    sync.increment();

    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          issues: state.issues.map((issue) =>
            issue.id === id ? updated : issue
          ),
        }));
        if (undoFields && prevIssue) {
          useUndoStore.getState().pushUndo({
            actionType: "update",
            entityType: "issue",
            entityId: id,
            description: `Updated City-${prevIssue.number}`,
            previousState: undoFields,
          });
        }
        sync.decrement();
        return true;
      }
      // Revert on failure
      set({ issues: prev });
      sync.decrement();
      toast.error("Failed to update issue");
      return false;
    } catch {
      set({ issues: prev });
      sync.decrement();
      toast.error("Failed to update issue");
      return false;
    }
  },

  batchUpdateIssues: async (ids, data) => {
    const prev = get().issues;
    const targets = prev.filter((i) => ids.includes(i.id));
    if (targets.length === 0) return false;

    // Prepare undo items
    const batchItems = targets.map((issue) => {
      const previousState: Record<string, unknown> = {};
      for (const key of Object.keys(data)) {
        previousState[key] = (issue as Record<string, unknown>)[key];
      }
      return { entityId: issue.id, previousState };
    });

    // Optimistic update
    set((state) => ({
      issues: state.issues.map((issue) =>
        ids.includes(issue.id) ? { ...issue, ...data } : issue
      ),
    }));

    const sync = useSyncStore.getState();
    sync.increment();

    try {
      const res = await fetch("/api/issues/batch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueIds: ids, updates: data }),
      });

      if (res.ok) {
        // We don't get back the full updated objects, so we trust our optimistic update
        // but ideally we should refetch or trust the response if it returned data.
        // For now, keep optimistic state.

        useUndoStore.getState().pushUndo({
          actionType: "update",
          entityType: "issue",
          entityId: "batch", // Placeholder
          description: `Updated ${ids.length} issues`,
          previousState: {}, // Unused for batch
          batchItems,
        });

        sync.decrement();
        return true;
      }

      // Revert
      set({ issues: prev });
      sync.decrement();
      toast.error("Failed to batch update issues");
      return false;
    } catch {
      set({ issues: prev });
      sync.decrement();
      toast.error("Failed to batch update issues");
      return false;
    }
  },

  deleteIssue: async (id) => {
    const prev = get().issues;
    const issueToDelete = prev.find((i) => i.id === id);

    // Optimistic delete (undo pushed only on API success)
    set((state) => ({
      issues: state.issues.filter((issue) => issue.id !== id),
    }));

    const sync = useSyncStore.getState();
    sync.increment();

    try {
      const res = await fetch(`/api/issues/${id}`, { method: "DELETE" });
      if (!res.ok) {
        set({ issues: prev });
        sync.decrement();
        toast.error("Failed to delete issue");
        return false;
      }
      if (issueToDelete) {
        useUndoStore.getState().pushUndo({
          actionType: "delete",
          entityType: "issue",
          entityId: id,
          description: `City-${issueToDelete.number}`,
          previousState: {
            ...issueToDelete,
            labels: issueToDelete.labels,
          },
        });
      }
      sync.decrement();
      return true;
    } catch {
      set({ issues: prev });
      sync.decrement();
      toast.error("Failed to delete issue");
      return false;
    }
  },

  batchDeleteIssues: async (ids) => {
    const prev = get().issues;
    const targets = prev.filter((i) => ids.includes(i.id));
    if (targets.length === 0) return false;

    // Prepare undo items
    const batchItems = targets.map((issue) => ({
      entityId: issue.id,
      previousState: { ...issue, labels: issue.labels },
    }));

    // Optimistic delete
    set((state) => ({
      issues: state.issues.filter((issue) => !ids.includes(issue.id)),
    }));

    const sync = useSyncStore.getState();
    sync.increment();

    try {
      const res = await fetch("/api/issues/batch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueIds: ids }),
      });

      if (res.ok) {
        useUndoStore.getState().pushUndo({
          actionType: "delete",
          entityType: "issue",
          entityId: "batch",
          description: `${ids.length} issues`,
          previousState: {},
          batchItems,
        });

        sync.decrement();
        return true;
      }

      set({ issues: prev });
      sync.decrement();
      toast.error("Failed to batch delete issues");
      return false;
    } catch {
      set({ issues: prev });
      sync.decrement();
      toast.error("Failed to batch delete issues");
      return false;
    }
  },

  setIssues: (issues) => set({ issues }),
  navigationIds: [],
  setNavigationIds: (ids) => set({ navigationIds: ids }),
}));
