"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDeferredLoading } from "@/lib/hooks/use-deferred-loading";
import { ArrowLeft, Trash2, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () =>
    import("@/components/editor/rich-text-editor").then(
      (m) => m.RichTextEditor
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-md border border-border bg-city-surface h-[140px] animate-pulse" />
    ),
  }
);

const CommentSection = dynamic(
  () =>
    import("@/components/comments/comment-section").then(
      (m) => m.CommentSection
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 bg-city-surface animate-pulse rounded-md" />
    ),
  }
);
import {
  StatusPicker,
  PriorityPicker,
  LabelPicker,
  ProjectPicker,
  AssigneeInput,
} from "@/components/issues/issue-properties";
import { ParentIssuePicker } from "@/components/issues/parent-issue-picker";
import { LabelBadge } from "@/components/label-badge";
import { StatusBadge } from "@/components/status-badge";
import { PriorityIcon } from "@/components/priority-icon";
import { useIssueStore } from "@/lib/stores/issue-store";
import { useLabelStore } from "@/lib/stores/label-store";
import { useProjectStore } from "@/lib/stores/project-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { useUndoStore } from "@/lib/stores/undo-store";
import { executeUndo } from "@/lib/undo-executor";
import type { IssueWithLabels } from "@/types";
import type { Status, Priority } from "@/lib/constants";
import { toast } from "sonner";
import Link from "next/link";

import { IndustrialSkeleton } from "@/components/ui/industrial-skeleton";
import { AttachmentList } from "@/components/issues/attachment-list";

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
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");

  // Synchronous reset when navigating between issues (same route type stays mounted)
  const [prevIssueId, setPrevIssueId] = useState(issueId);
  if (issueId !== prevIssueId) {
    setPrevIssueId(issueId);
    setIssue(null);
    setLoading(true);
    setEditingTitle(false);
  }

  const fetchIssue = useCallback(async () => {
    try {
      const res = await fetch(`/api/issues/${issueId}`);
      if (res.ok) {
        const data = await res.json();
        setIssue(data);
        setTitleValue(data.title);
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

  const handleTitleSave = () => {
    if (titleValue.trim() && titleValue !== issue?.title) {
      handleUpdate({ title: titleValue.trim() });
    }
    setEditingTitle(false);
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

  const children = issue?.children || [];
  const childrenDone = children.filter((c) => c.status === "done").length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header — always visible, structural */}
      <div className="flex items-center gap-2 h-12 px-4 border-b border-border shrink-0">
        <Link href="/issues">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        {issue?.parent && (
          <>
            <Link
              href={`/issues/${issue.parent.id}`}
              className="text-xs text-muted-foreground font-mono hover:text-city-yellow transition-colors"
            >
              City-{issue.parent.number}
            </Link>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          </>
        )}
        {issue && (
          <span className="text-xs text-muted-foreground font-mono">
            City-{issue.number}
          </span>
        )}
        <div className="flex-1" />
        {issue && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content — transitions per issue */}
      {loading ? (
        showSkeleton ? detailLoadingSkeleton : null
      ) : !issue ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Issue not found
        </div>
      ) : (
        <div key={issue.id} className="flex-1 flex overflow-hidden animate-fade-in">
          {/* Main */}
          <div className="flex-1 overflow-auto p-6 space-y-4">
            {editingTitle ? (
              <Input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") {
                    setTitleValue(issue.title);
                    setEditingTitle(false);
                  }
                }}
                className="text-xl font-semibold border-0 bg-transparent px-0 h-auto focus-visible:ring-0"
                autoFocus
              />
            ) : (
              <h1
                className="text-xl font-semibold cursor-text hover:bg-city-surface/50 rounded px-1 -mx-1 py-0.5"
                onClick={() => setEditingTitle(true)}
              >
                {issue.title}
              </h1>
            )}

            <RichTextEditor
              content={issue.description || ""}
              onChange={(html) => {
                const clean = html === "<p></p>" ? "" : html;
                if (clean !== issue.description) {
                  handleUpdate({ description: clean || null });
                }
              }}
            />

            {/* Attachments */}
            <AttachmentList
              issueId={issue.id}
              attachments={issue.attachments}
              onUpload={fetchIssue}
            />

            {/* Sub-Issues Section */}
            {!issue.parentId && (
              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    Sub-Issues
                    {children.length > 0 && (
                      <span className="ml-2 text-xs opacity-60">
                        {childrenDone}/{children.length}
                      </span>
                    )}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1 text-muted-foreground hover:text-city-yellow"
                    onClick={handleAddSubIssue}
                  >
                    <Plus className="w-3 h-3" />
                    Add sub-issue
                  </Button>
                </div>

                {children.length > 0 && (
                  <>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-city-surface rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{
                          width: `${(childrenDone / children.length) * 100}%`,
                        }}
                      />
                    </div>

                    {/* Child issue rows */}
                    <div className="border border-border rounded-md overflow-hidden">
                      {children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/issues/${child.id}`}
                          className="flex items-center gap-3 h-9 px-3 text-sm border-b border-border/50 last:border-0 hover:bg-city-surface-hover transition-colors"
                        >
                          <StatusBadge status={child.status as Status} size={12} />
                          <PriorityIcon priority={child.priority as Priority} size={12} />
                          <span className="text-xs text-muted-foreground font-mono shrink-0">
                            City-{child.number}
                          </span>
                          <span className="flex-1 truncate">{child.title}</span>
                          {child.labels.length > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              {child.labels.slice(0, 2).map((label) => (
                                <LabelBadge
                                  key={label.id}
                                  name={label.name}
                                  color={label.color}
                                />
                              ))}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </>
                )}

                {children.length === 0 && (
                  <div className="text-xs text-muted-foreground/60 py-2">
                    No sub-issues yet
                  </div>
                )}
              </div>
            )}

            <Separator className="my-2" />

            <CommentSection issueId={issueId} />
          </div>

          {/* Properties sidebar */}
          <div className="w-64 border-l border-border p-4 space-y-4 overflow-auto shrink-0">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Status
              </div>
              <StatusPicker
                value={issue.status as Status}
                onChange={(status) => handleUpdate({ status })}
              />
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Priority
              </div>
              <PriorityPicker
                value={issue.priority as Priority}
                onChange={(priority) => handleUpdate({ priority })}
              />
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Assignee
              </div>
              <AssigneeInput
                value={issue.assignee}
                onChange={(assignee) => handleUpdate({ assignee })}
              />
            </div>

            <Separator />

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Labels
              </div>
              <div className="flex flex-wrap gap-1 mb-1">
                {issue.labels.map((label) => (
                  <LabelBadge
                    key={label.id}
                    name={label.name}
                    color={label.color}
                  />
                ))}
              </div>
              <LabelPicker
                labels={labels}
                selectedIds={issue.labels.map((l) => l.id)}
                onChange={handleLabelChange}
              />
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Project
              </div>
              <ProjectPicker
                projects={projects}
                value={issue.projectId}
                onChange={(projectId) => handleUpdate({ projectId })}
              />
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Parent Issue
              </div>
              <ParentIssuePicker
                value={issue.parentId || null}
                currentIssueId={issue.id}
                onChange={(parentId) => handleUpdate({ parentId })}
              />
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Due Date
              </div>
              <DatePicker
                value={issue.dueDate || null}
                onChange={(val) => handleUpdate({ dueDate: val })}
                className="h-8 text-sm bg-transparent"
              />
            </div>

            <Separator />

            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div>
                Created{" "}
                {new Date(issue.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div>
                Updated{" "}
                {new Date(issue.updatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
