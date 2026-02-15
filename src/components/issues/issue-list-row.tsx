"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { PriorityIcon } from "@/components/priority-icon";
import { LabelBadge } from "@/components/label-badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { IssueWithLabels } from "@/types";
import {
  STATUSES,
  STATUS_CONFIG,
  PRIORITIES,
  PRIORITY_CONFIG,
  type Status,
  type Priority,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui-store";
import { useIssueStore } from "@/lib/stores/issue-store";
import { useUndoStore } from "@/lib/stores/undo-store";
import { executeUndo } from "@/lib/undo-executor";
import { Calendar, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function IssueListRow({ issue, depth = 0, animationIndex = 0 }: { issue: IssueWithLabels; depth?: number; animationIndex?: number }) {
  const isFocused = useUIStore((s) => s.focusedIssueId === issue.id);
  const isSelected = useUIStore((s) => s.selectedIssueIds.has(issue.id));
  const toggleIssueSelection = useUIStore((s) => s.toggleIssueSelection);
  const selectAllIssues = useUIStore((s) => s.selectAllIssues);
  const updateIssue = useIssueStore((s) => s.updateIssue);
  const deleteIssue = useIssueStore((s) => s.deleteIssue);

  const isOverdue =
    issue.dueDate &&
    new Date(issue.dueDate) < new Date() &&
    issue.status !== "done";

  const handleClick = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      toggleIssueSelection(issue.id);
    } else if (e.shiftKey) {
      e.preventDefault();
      const { focusedIssueId, selectedIssueIds } = useUIStore.getState();
      const { navigationIds } = useIssueStore.getState();
      const anchorId = focusedIssueId; // Use focused issue as anchor

      if (anchorId) {
        const startIndex = navigationIds.indexOf(anchorId);
        const endIndex = navigationIds.indexOf(issue.id);

        if (startIndex !== -1 && endIndex !== -1) {
          const start = Math.min(startIndex, endIndex);
          const end = Math.max(startIndex, endIndex);
          const range = navigationIds.slice(start, end + 1);

          // Union with existing selection
          const newSelection = new Set(selectedIssueIds);
          range.forEach(id => newSelection.add(id));
          selectAllIssues(Array.from(newSelection));
        }
      } else {
        toggleIssueSelection(issue.id);
      }
    }
  };

  const handleStatusChange = (status: string) => {
    updateIssue(issue.id, { status });
  };

  const handlePriorityChange = (priority: string) => {
    updateIssue(issue.id, { priority });
  };

  const handleDelete = async () => {
    const success = await deleteIssue(issue.id);
    if (success) {
      const entry = useUndoStore.getState().peekUndo();
      toast.success(`Deleted City-${issue.number}`, {
        action: entry
          ? { label: "Undo", onClick: () => executeUndo(entry) }
          : undefined,
      });
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Link
          href={`/issues/${issue.id}`}
          onClick={handleClick}
          className={cn(
            "flex items-center gap-3 h-10 px-4 text-sm border-b border-border/50 transition-colors hover:bg-city-surface-hover group animate-stagger-in select-none",
            isFocused && "ring-1 ring-inset ring-city-yellow/50 border-l-2 !border-l-city-yellow",
            isSelected ? "bg-city-yellow/20" : isFocused ? "bg-city-yellow/5" : "",
            depth > 0 && "relative"
          )}
          style={{
            contentVisibility: "auto",
            containIntrinsicSize: "0 40px",
            animationDelay: `${animationIndex * 30}ms`,
            ...(depth > 0 ? { paddingLeft: `${16 + depth * 24}px` } : {}),
          }}
          data-issue-id={issue.id}
        >
          {depth > 0 && (
            <>
              {/* Vertical tree line */}
              <span
                className="absolute top-0 bottom-0 w-px bg-border"
                style={{ left: `${8 + (depth - 1) * 24}px` }}
              />
              {/* Horizontal connector */}
              <span
                className="absolute w-3 h-px bg-border"
                style={{ left: `${8 + (depth - 1) * 24}px`, top: "50%" }}
              />
            </>
          )}
          <StatusBadge status={issue.status as Status} size={14} />
          <PriorityIcon priority={issue.priority as Priority} size={14} />
          <span className="text-xs text-muted-foreground font-mono w-16 shrink-0">
            City-{issue.number}
          </span>
          <span className="flex-1 truncate">{issue.title}</span>

          {issue.labels.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              {issue.labels.slice(0, 3).map((label) => (
                <LabelBadge
                  key={label.id}
                  name={label.name}
                  color={label.color}
                />
              ))}
              {issue.labels.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{issue.labels.length - 3}
                </span>
              )}
            </div>
          )}

          {issue.dueDate && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs shrink-0",
                isOverdue ? "text-destructive" : "text-muted-foreground"
              )}
            >
              <Calendar className="w-3 h-3" />
              {new Date(issue.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          )}

          {issue.commentCount ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <MessageSquare className="w-3 h-3" />
              {issue.commentCount}
            </div>
          ) : null}

          {issue.project && (
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: issue.project.color }}
              />
              <span className="text-xs text-muted-foreground truncate max-w-20">
                {issue.project.name}
              </span>
            </div>
          )}

          {issue.assignee && (
            <div className="w-5 h-5 rounded-full bg-city-yellow/20 flex items-center justify-center text-[11px] text-city-yellow font-medium shrink-0">
              {issue.assignee[0]?.toUpperCase()}
            </div>
          )}
        </Link>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuSub>
          <ContextMenuSubTrigger>Status</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {STATUSES.map((status) => (
              <ContextMenuItem
                key={status}
                onClick={() => handleStatusChange(status)}
              >
                <StatusBadge status={status} size={12} />
                <span className="ml-2">{STATUS_CONFIG[status].label}</span>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger>Priority</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {PRIORITIES.map((priority) => (
              <ContextMenuItem
                key={priority}
                onClick={() => handlePriorityChange(priority)}
              >
                <PriorityIcon priority={priority} size={12} />
                <span className="ml-2">{PRIORITY_CONFIG[priority].label}</span>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem
          className="text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
