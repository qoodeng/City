"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import dynamic from "next/dynamic";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { PriorityIcon } from "@/components/priority-icon";
import { LabelBadge } from "@/components/label-badge";
import { AttachmentList } from "@/components/issues/attachment-list";
import type { IssueWithLabels } from "@/types";
import type { Status, Priority } from "@/lib/constants";

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

interface IssueContentProps {
  issue: IssueWithLabels;
  onUpdate: (data: Record<string, unknown>) => Promise<void>;
  onRefresh: () => Promise<void>;
  onAddSubIssue: () => void;
}

export function IssueContent({
  issue,
  onUpdate,
  onRefresh,
  onAddSubIssue,
}: IssueContentProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(issue.title);

  // Sync title value if it changes externally
  useEffect(() => {
    setTitleValue(issue.title);
  }, [issue.title]);

  const handleTitleSave = () => {
    if (titleValue.trim() && titleValue !== issue.title) {
      onUpdate({ title: titleValue.trim() });
    }
    setEditingTitle(false);
  };

  const children = issue.children || [];
  const childrenDone = children.filter((c) => c.status === "done").length;

  return (
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
            onUpdate({ description: clean || null });
          }
        }}
      />

      {/* Attachments */}
      <AttachmentList
        issueId={issue.id}
        attachments={issue.attachments}
        onUpload={onRefresh}
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
              onClick={onAddSubIssue}
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

      <CommentSection issueId={issue.id} />
    </div>
  );
}
