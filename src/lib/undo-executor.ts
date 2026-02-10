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

async function undoDelete(entry: UndoEntry): Promise<boolean> {
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
      await useCommentStore.getState().fetchComments(issueId);
      toast.success(`Restored ${entry.description}`);
      return true;
    }
    toast.error("Failed to restore");
    return false;
  }

  const endpoint = `/api/${entityType === "issue" ? "issues" : entityType === "project" ? "projects" : "labels"}/restore`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(previousState),
  });

  if (res.ok) {
    // Refetch the store to get fresh data
    if (entityType === "issue") {
      await useIssueStore.getState().fetchIssues();
    } else if (entityType === "project") {
      await useProjectStore.getState().fetchProjects();
    } else {
      await useLabelStore.getState().fetchLabels();
    }
    toast.success(`Restored ${entry.description}`);
    return true;
  }
  toast.error("Failed to restore");
  return false;
}

async function undoUpdate(entry: UndoEntry): Promise<boolean> {
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
      await useCommentStore.getState().fetchComments(issueId);
      toast.success(`Undid: ${entry.description}`);
      return true;
    }
    toast.error("Undo failed");
    return false;
  }

  const endpoint = entityType === "issue"
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
      useIssueStore.setState((state) => ({
        issues: state.issues.map((i) => (i.id === entityId ? updated : i)),
      }));
    } else if (entityType === "project") {
      await useProjectStore.getState().fetchProjects();
    } else {
      await useLabelStore.getState().fetchLabels();
    }
    toast.success(`Undid: ${entry.description}`);
    return true;
  }
  toast.error("Undo failed");
  return false;
}

async function undoCreate(entry: UndoEntry): Promise<boolean> {
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
      toast.success(`Undid: ${entry.description}`);
      return true;
    }
    toast.error("Undo failed");
    return false;
  }

  const endpoint = entityType === "issue"
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
    toast.success(`Undid: ${entry.description}`);
    return true;
  }
  toast.error("Undo failed");
  return false;
}
