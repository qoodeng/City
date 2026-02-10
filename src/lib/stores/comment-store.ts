"use client";

import { create } from "zustand";
import type { Comment } from "@/types";
import { useUndoStore } from "./undo-store";
import { useSyncStore } from "./sync-store";

interface CommentState {
  comments: Comment[];
  issueId: string | null;
  loading: boolean;

  fetchComments: (issueId: string) => Promise<void>;
  createComment: (issueId: string, content: string) => Promise<Comment | null>;
  updateComment: (
    issueId: string,
    commentId: string,
    content: string
  ) => Promise<boolean>;
  deleteComment: (issueId: string, commentId: string) => Promise<boolean>;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  issueId: null,
  loading: false,

  fetchComments: async (issueId) => {
    set({ loading: true, issueId });
    try {
      const res = await fetch(`/api/issues/${issueId}/comments`);
      if (res.ok) {
        const data = await res.json();
        set({ comments: data });
      }
    } finally {
      set({ loading: false });
    }
  },

  createComment: async (issueId, content) => {
    const sync = useSyncStore.getState();
    sync.increment();
    try {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const comment = await res.json();
        set((state) => ({ comments: [...state.comments, comment] }));
        useUndoStore.getState().pushUndo({
          actionType: "create",
          entityType: "comment",
          entityId: comment.id,
          description: "Created comment",
          previousState: { issueId },
        });
        sync.decrement();
        return comment;
      }
      sync.decrement();
      return null;
    } catch {
      sync.decrement();
      return null;
    }
  },

  updateComment: async (issueId, commentId, content) => {
    const prev = get().comments;
    const prevComment = prev.find((c) => c.id === commentId);

    if (prevComment) {
      useUndoStore.getState().pushUndo({
        actionType: "update",
        entityType: "comment",
        entityId: commentId,
        description: "Updated comment",
        previousState: { content: prevComment.content, issueId },
      });
    }

    // Optimistic update
    set((state) => ({
      comments: state.comments.map((c) =>
        c.id === commentId ? { ...c, content, updatedAt: new Date().toISOString() } : c
      ),
    }));

    const sync = useSyncStore.getState();
    sync.increment();

    try {
      const res = await fetch(
        `/api/issues/${issueId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === commentId ? updated : c
          ),
        }));
        sync.decrement();
        return true;
      }
      set({ comments: prev });
      sync.decrement();
      return false;
    } catch {
      set({ comments: prev });
      sync.decrement();
      return false;
    }
  },

  deleteComment: async (issueId, commentId) => {
    const prev = get().comments;
    const commentToDelete = prev.find((c) => c.id === commentId);

    if (commentToDelete) {
      useUndoStore.getState().pushUndo({
        actionType: "delete",
        entityType: "comment",
        entityId: commentId,
        description: "comment",
        previousState: { ...commentToDelete, issueId },
      });
    }

    set((state) => ({
      comments: state.comments.filter((c) => c.id !== commentId),
    }));

    const sync = useSyncStore.getState();
    sync.increment();

    try {
      const res = await fetch(
        `/api/issues/${issueId}/comments/${commentId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        set({ comments: prev });
        sync.decrement();
        return false;
      }
      sync.decrement();
      return true;
    } catch {
      set({ comments: prev });
      sync.decrement();
      return false;
    }
  },
}));
