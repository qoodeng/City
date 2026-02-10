"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { PriorityIcon } from "@/components/priority-icon";
import { LabelBadge } from "@/components/label-badge";
import type { IssueWithLabels } from "@/types";
import type { Priority } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useIssueStore } from "@/lib/stores/issue-store";
import { useUIStore } from "@/lib/stores/ui-store";

export function IssueBoardCard({ issue, animationIndex = 0 }: { issue: IssueWithLabels; animationIndex?: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id });
  const { focusedIssueId } = useUIStore();
  const isFocused = focusedIssueId === issue.id;

  // Count sub-issues via primitive selectors (rule: rerender-derived-state, js-combine-iterations)
  const childCount = useIssueStore((s) => {
    let count = 0;
    for (const i of s.issues) if (i.parentId === issue.id) count++;
    return count;
  });
  const childDone = useIssueStore((s) => {
    let count = 0;
    for (const i of s.issues) if (i.parentId === issue.id && i.status === "done") count++;
    return count;
  });

  // Translate-only transform prevents dnd-kit scale from resizing the card
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { willChange: "transform" } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={isDragging ? style : { ...style, animationDelay: `${animationIndex * 40}ms` }}
      {...attributes}
      {...listeners}
      data-issue-id={issue.id}
      className={cn(
        "rounded-md border border-border bg-card p-3 cursor-grab active:cursor-grabbing hover:border-city-yellow/20",
        !isDragging && "animate-stagger-in",
        isDragging && "opacity-40 shadow-none",
        isFocused && "ring-2 ring-city-yellow/60 bg-city-yellow/10 border-city-yellow/50"
      )}
    >
      <BoardCardContent issue={issue} isDragging={isDragging} childCount={childCount} childDone={childDone} />
    </div>
  );
}

function BoardCardContent({
  issue,
  isDragging = false,
  childCount = 0,
  childDone = 0,
}: {
  issue: IssueWithLabels;
  isDragging?: boolean;
  childCount?: number;
  childDone?: number;
}) {
  return (
    <Link
      href={`/issues/${issue.id}`}
      className="block"
      onClick={(e) => {
        if (isDragging) e.preventDefault();
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <PriorityIcon priority={issue.priority as Priority} size={12} />
        <span className="text-[11px] text-muted-foreground font-mono">
          CITY-{issue.number}
        </span>
        {childCount > 0 && (
          <span className="ml-auto text-[11px] text-muted-foreground bg-city-surface px-1.5 py-0.5 rounded">
            {childDone}/{childCount}
          </span>
        )}
      </div>

      <p className="text-sm font-medium leading-snug mb-2 line-clamp-2">
        {issue.title}
      </p>

      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {issue.labels.slice(0, 2).map((label) => (
            <LabelBadge key={label.id} name={label.name} color={label.color} />
          ))}
          {issue.labels.length > 2 && (
            <span className="text-[11px] text-muted-foreground">
              +{issue.labels.length - 2}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        {issue.commentCount ? (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MessageSquare className="w-3 h-3" />
            {issue.commentCount}
          </div>
        ) : (
          <div />
        )}
        {issue.assignee ? (
          <div className="w-5 h-5 rounded-full bg-city-yellow/20 flex items-center justify-center text-[11px] text-city-yellow font-medium">
            {issue.assignee[0]?.toUpperCase()}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function IssueBoardCardOverlay({
  issue,
}: {
  issue: IssueWithLabels;
}) {
  return (
    <div className="rounded-md border border-city-yellow/30 bg-card p-3 shadow-2xl shadow-black/40 rotate-1 w-[calc(18rem-1rem)] scale-[1.02]">
      <BoardCardContent issue={issue} />
    </div>
  );
}
