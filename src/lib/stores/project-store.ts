"use client";

import { create } from "zustand";
import type { ProjectWithCounts } from "@/types";
import { useUndoStore } from "./undo-store";
import { useSyncStore } from "./sync-store";
import { toast } from "sonner";

interface ProjectState {
  projects: ProjectWithCounts[];
  loading: boolean;

  fetchProjects: () => Promise<void>;
  createProject: (
    data: Record<string, unknown>
  ) => Promise<ProjectWithCounts | null>;
  updateProject: (
    id: string,
    data: Record<string, unknown>
  ) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        set({ projects: data });
      }
    } finally {
      set({ loading: false });
    }
  },

  createProject: async (data) => {
    const sync = useSyncStore.getState();
    sync.increment();
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const project = await res.json();
        set((state) => ({ projects: [...state.projects, project] }));
        useUndoStore.getState().pushUndo({
          actionType: "create",
          entityType: "project",
          entityId: project.id,
          description: `Created project "${project.name}"`,
          previousState: {},
        });
        sync.decrement();
        return project;
      }
      sync.decrement();
      toast.error("Failed to create project");
      return null;
    } catch {
      sync.decrement();
      toast.error("Failed to create project");
      return null;
    }
  },

  updateProject: async (id, data) => {
    const prev = get().projects;
    const prevProject = prev.find((p) => p.id === id);

    // Capture undo data before update (pushed only on API success)
    let undoFields: Record<string, unknown> | null = null;
    if (prevProject) {
      undoFields = {};
      for (const key of Object.keys(data)) {
        undoFields[key] = (prevProject as Record<string, unknown>)[key];
      }
    }

    // Optimistic update
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    }));

    const sync = useSyncStore.getState();
    sync.increment();

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? updated : p)),
        }));
        if (undoFields && prevProject) {
          useUndoStore.getState().pushUndo({
            actionType: "update",
            entityType: "project",
            entityId: id,
            description: `Updated project "${prevProject.name}"`,
            previousState: undoFields,
          });
        }
        sync.decrement();
        return true;
      }
      set({ projects: prev });
      sync.decrement();
      toast.error("Failed to update project");
      return false;
    } catch {
      set({ projects: prev });
      sync.decrement();
      toast.error("Failed to update project");
      return false;
    }
  },

  deleteProject: async (id) => {
    const prev = get().projects;
    const projectToDelete = prev.find((p) => p.id === id);

    // Optimistic delete (undo pushed only on API success)
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    }));

    const sync = useSyncStore.getState();
    sync.increment();

    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (projectToDelete) {
          useUndoStore.getState().pushUndo({
            actionType: "delete",
            entityType: "project",
            entityId: id,
            description: `project "${projectToDelete.name}"`,
            previousState: { ...projectToDelete },
          });
        }
        sync.decrement();
        return true;
      }
      set({ projects: prev });
      sync.decrement();
      toast.error("Failed to delete project");
      return false;
    } catch {
      set({ projects: prev });
      sync.decrement();
      toast.error("Failed to delete project");
      return false;
    }
  },
}));
