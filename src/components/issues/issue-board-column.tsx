"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { StatusBadge } from "@/components/status-badge";
import { STATUS_CONFIG, type Status } from "@/lib/constants";
import { IssueBoardCard } from "./issue-board-card";
import type { IssueWithLabels } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function IssueBoardColumn({
  status,
  issues,
}: {
  status: Status;
  issues: IssueWithLabels[];
}) {
  const config = STATUS_CONFIG[status];
  const { setNodeRef, isOver, active } = useDroppable({ id: status });

  return (
    <div className={cn(
      "flex flex-col min-w-56 w-72 shrink h-full min-h-0 bg-city-surface/50 rounded-lg transition-colors",
      isOver && active && "bg-city-yellow/5"
    )}>
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
        <StatusBadge status={status} size={14} />
        <span className="text-xs font-medium">{config.label}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {issues.length}
        </span>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div ref={setNodeRef} className={cn(
          "p-2 pb-4 space-y-2 min-h-24 transition-shadow",
          isOver && active && "ring-1 ring-inset ring-city-yellow/20"
        )}>
          <SortableContext
            items={issues.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {issues.map((issue, i) => (
              <IssueBoardCard key={issue.id} issue={issue} animationIndex={i} />
            ))}
          </SortableContext>
        </div>
      </ScrollArea>
    </div>
  );
}
