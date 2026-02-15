"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDeferredLoading } from "@/lib/hooks/use-deferred-loading";
import { useIssueStore } from "@/lib/stores/issue-store";
import { useLabelStore } from "@/lib/stores/label-store";
import { useProjectStore } from "@/lib/stores/project-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { useUndoStore } from "@/lib/stores/undo-store";
import { executeUndo } from "@/lib/undo-executor";
import type { IssueWithLabels } from "@/types";
import { toast } from "sonner";

import { IndustrialSkeleton } from "@/components/ui/industrial-skeleton";
import { IssueHeader } from "@/components/issues/issue-detail/IssueHeader";
import { IssueContent } from "@/components/issues/issue-detail/IssueContent";
import { IssueSidebar } from "@/components/issues/issue-detail/IssueSidebar";

const detailLoadingSkeleton = (
  <div className="flex-1 p-6 space-y-4 animate-fade-in">
    <IndustrialSkeleton className="h-4 w-16 rounded" />
    <IndustrialSkeleton className="h-8 w-64 rounded" />
    <IndustrialSkeleton className="h-32 w-full rounded" />
  </div>
);

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params.issueId as string;

  const updateIssue = useIssueStore((s) => s.updateIssue);
  const deleteIssue = useIssueStore((s) => s.deleteIssue);
  const labels = useLabelStore((s) => s.labels);
  const projects = useProjectStore((s) => s.projects);
  const setCreateIssueDialogOpen = useUIStore((s) => s.setCreateIssueDialogOpen);
  const setCreateIssueParentId = useUIStore((s) => s.setCreateIssueParentId);

  const [issue, setIssue] = useState<IssueWithLabels | null>(null);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useDeferredLoading(loading);

  // Synchronous reset when navigating between issues (same route type stays mounted)
  const [prevIssueId, setPrevIssueId] = useState(issueId);
  if (issueId !== prevIssueId) {
    setPrevIssueId(issueId);
    setIssue(null);
    setLoading(true);
  }

  const fetchIssue = useCallback(async () => {
    try {
      const res = await fetch(`/api/issues/${issueId}`);
      if (res.ok) {
        const data = await res.json();
        setIssue(data);
      }
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!issue) return;
    const success = await updateIssue(issue.id, data);
    if (success) {
      setIssue((prev) => (prev ? { ...prev, ...data } : prev));
    }
  };

  const handleLabelChange = async (labelIds: string[]) => {
    if (!issue) return;
    const success = await updateIssue(issue.id, { labelIds });
    if (success) {
      const selectedLabels = labels.filter((l) => labelIds.includes(l.id));
      setIssue((prev) => (prev ? { ...prev, labels: selectedLabels } : prev));
    }
  };

  const handleDelete = async () => {
    if (!issue) return;
    const success = await deleteIssue(issue.id);
    if (success) {
      const entry = useUndoStore.getState().peekUndo();
      toast.success(`Deleted City-${issue.number}`, {
        action: entry
          ? { label: "Undo", onClick: () => executeUndo(entry) }
          : undefined,
      });
      router.push("/issues");
    }
  };

  const handleAddSubIssue = () => {
    if (!issue) return;
    setCreateIssueParentId(issue.id);
    setCreateIssueDialogOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <IssueHeader issue={issue} onDelete={handleDelete} />

      {loading ? (
        showSkeleton ? detailLoadingSkeleton : null
      ) : !issue ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Issue not found
        </div>
      ) : (
        <div key={issue.id} className="flex-1 flex overflow-hidden animate-fade-in">
          <IssueContent
            issue={issue}
            onUpdate={handleUpdate}
            onRefresh={fetchIssue}
            onAddSubIssue={handleAddSubIssue}
          />
          <IssueSidebar
            issue={issue}
            labels={labels}
            projects={projects}
            onUpdate={handleUpdate}
            onLabelChange={handleLabelChange}
          />
        </div>
      )}
    </div>
  );
}
