import { useUndoStore, type UndoEntry } from "@/lib/stores/undo-store";
import { useIssueStore } from "@/lib/stores/issue-store";
import { useProjectStore } from "@/lib/stores/project-store";
import { useLabelStore } from "@/lib/stores/label-store";
import { useCommentStore } from "@/lib/stores/comment-store";
import { toast } from "sonner";

export async function executeUndo(entry?: UndoEntry | null): Promise<boolean> {
  const undoEntry = entry || useUndoStore.getState().popUndo();
  if (!undoEntry) {
    toast.info("Nothing to undo");
    return false;
  }

  // If entry was passed directly (from toast), also remove it from stack
  if (entry) {
    useUndoStore.setState((state) => ({
      stack: state.stack.filter((e) => e.id !== entry.id),
    }));
  }

  try {
    // Handle batch undo
    if (undoEntry.batchItems && undoEntry.batchItems.length > 0) {
      const promises = undoEntry.batchItems.map((item) => {
        const singleEntry: UndoEntry = {
          ...undoEntry,
          entityId: item.entityId,
          previousState: item.previousState,
          batchItems: undefined,
          description: item.entityId, // Placeholder
        };

        switch (undoEntry.actionType) {
          case "delete":
            return undoDelete(singleEntry, true);
          case "update":
            return undoUpdate(singleEntry, true);
          case "create":
            return undoCreate(singleEntry, true);
          default:
            return Promise.resolve(false);
        }
      });

      const results = await Promise.all(promises);
      const success = results.every(Boolean);

      if (success) {
        if (undoEntry.entityType === "issue") {
          await useIssueStore.getState().fetchIssues();
        }
        toast.success(`Undid: ${undoEntry.description}`);
        return true;
      }
      toast.error("Partial undo failure");
      return false;
    }

    switch (undoEntry.actionType) {
      case "delete":
        return await undoDelete(undoEntry);
      case "update":
        return await undoUpdate(undoEntry);
      case "create":
        return await undoCreate(undoEntry);
      default:
        return false;
    }
  } catch (error) {
    console.error("Undo failed:", error);
    toast.error("Undo failed");
    return false;
  }
}

async function undoDelete(entry: UndoEntry, silent = false): Promise<boolean> {
  const { entityType, previousState } = entry;

  if (entityType === "comment") {
    const issueId = previousState.issueId as string;
    const content = previousState.content as string;
    const res = await fetch(`/api/issues/${issueId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      if (!silent) await useCommentStore.getState().fetchComments(issueId);
      if (!silent) toast.success(`Restored ${entry.description}`);
      return true;
    }
    if (!silent) toast.error("Failed to restore");
    return false;
  }

  const endpoint = `/api/${
    entityType === "issue"
      ? "issues"
      : entityType === "project"
      ? "projects"
      : "labels"
  }/restore`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(previousState),
  });

  if (res.ok) {
    // In silent mode (batch), we don't refetch or toast for each item
    if (!silent) {
      if (entityType === "issue") {
        await useIssueStore.getState().fetchIssues();
      } else if (entityType === "project") {
        await useProjectStore.getState().fetchProjects();
      } else {
        await useLabelStore.getState().fetchLabels();
      }
      toast.success(`Restored ${entry.description}`);
    }
    return true;
  }
  if (!silent) toast.error("Failed to restore");
  return false;
}

async function undoUpdate(entry: UndoEntry, silent = false): Promise<boolean> {
  const { entityType, entityId, previousState } = entry;

  if (entityType === "comment") {
    const issueId = previousState.issueId as string;
    const content = previousState.content as string;
    const res = await fetch(`/api/issues/${issueId}/comments/${entityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      if (!silent) await useCommentStore.getState().fetchComments(issueId);
      if (!silent) toast.success(`Undid: ${entry.description}`);
      return true;
    }
    if (!silent) toast.error("Undo failed");
    return false;
  }

  const endpoint =
    entityType === "issue"
      ? `/api/issues/${entityId}`
      : entityType === "project"
      ? `/api/projects/${entityId}`
      : `/api/labels/${entityId}`;

  const res = await fetch(endpoint, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(previousState),
  });

  if (res.ok) {
    if (entityType === "issue") {
      const updated = await res.json();
      // Update store optimistically or via response
      useIssueStore.setState((state) => ({
        issues: state.issues.map((i) => (i.id === entityId ? updated : i)),
      }));
    } else if (!silent) {
      // For projects/labels, we refetch if not silent (for issues we update state directly)
      if (entityType === "project") {
        await useProjectStore.getState().fetchProjects();
      } else {
        await useLabelStore.getState().fetchLabels();
      }
    }
    if (!silent) toast.success(`Undid: ${entry.description}`);
    return true;
  }
  if (!silent) toast.error("Undo failed");
  return false;
}

async function undoCreate(entry: UndoEntry, silent = false): Promise<boolean> {
  const { entityType, entityId, previousState } = entry;

  if (entityType === "comment") {
    const issueId = previousState.issueId as string;
    const res = await fetch(`/api/issues/${issueId}/comments/${entityId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      useCommentStore.setState((state) => ({
        comments: state.comments.filter((c) => c.id !== entityId),
      }));
      if (!silent) toast.success(`Undid: ${entry.description}`);
      return true;
    }
    if (!silent) toast.error("Undo failed");
    return false;
  }

  const endpoint =
    entityType === "issue"
      ? `/api/issues/${entityId}`
      : entityType === "project"
      ? `/api/projects/${entityId}`
      : `/api/labels/${entityId}`;

  const res = await fetch(endpoint, { method: "DELETE" });

  if (res.ok) {
    if (entityType === "issue") {
      useIssueStore.setState((state) => ({
        issues: state.issues.filter((i) => i.id !== entityId),
      }));
    } else if (entityType === "project") {
      useProjectStore.setState((state) => ({
        projects: state.projects.filter((p) => p.id !== entityId),
      }));
    } else {
      useLabelStore.setState((state) => ({
        labels: state.labels.filter((l) => l.id !== entityId),
      }));
    }
    if (!silent) toast.success(`Undid: ${entry.description}`);
    return true;
  }
  if (!silent) toast.error("Undo failed");
  return false;
}
