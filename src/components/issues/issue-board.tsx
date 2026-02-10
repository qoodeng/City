"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { STATUSES, type Status } from "@/lib/constants";
import { IssueBoardColumn } from "./issue-board-column";
import { IssueBoardCardOverlay } from "./issue-board-card";
import { useIssueStore } from "@/lib/stores/issue-store";
import type { IssueWithLabels } from "@/types";
import { EmptyState } from "@/components/empty-state";

export function IssueBoard({ issues }: { issues: IssueWithLabels[] }) {
  const [activeIssue, setActiveIssue] = useState<IssueWithLabels | null>(null);
  const updateIssue = useIssueStore((s) => s.updateIssue);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const grouped = useMemo(() => {
    const groups: Record<string, IssueWithLabels[]> = {};
    for (const status of STATUSES) {
      groups[status] = [];
    }
    for (const issue of issues) {
      const status = issue.status as Status;
      if (groups[status]) {
        groups[status].push(issue);
      }
    }
    return groups;
  }, [issues]);

  // Sync displayed IDs for J/K navigation (Column by Column)
  useEffect(() => {
    const ids: string[] = [];
    for (const status of STATUSES) {
      if (grouped[status]) {
        for (const issue of grouped[status]) {
          ids.push(issue.id);
        }
      }
    }
    useIssueStore.getState().setNavigationIds(ids);
    return () => useIssueStore.getState().setNavigationIds([]);
  }, [grouped]);

  // Build index map for O(1) lookups during drag (rule: js-index-maps)
  const issueById = useMemo(
    () => new Map(issues.map((i) => [i.id, i])),
    [issues]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const issue = issueById.get(event.active.id as string);
      if (issue) setActiveIssue(issue);
    },
    [issueById]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveIssue(null);
      const { active, over } = event;
      if (!over) return;

      const issueId = active.id as string;

      // Determine target status — either it's dropped on a column (status id) or on another card
      let targetStatus: string | null = null;

      if (STATUSES.includes(over.id as Status)) {
        targetStatus = over.id as string;
      } else {
        const targetIssue = issueById.get(over.id as string);
        if (targetIssue) {
          targetStatus = targetIssue.status;
        }
      }

      if (!targetStatus) return;

      const issue = issueById.get(issueId);
      if (!issue || issue.status === targetStatus) return;

      updateIssue(issueId, { status: targetStatus });
    },
    [issueById, updateIssue]
  );

  if (issues.length === 0) {
    return (
      <EmptyState
        title="No issues yet"
        subtitle="Press C to create one"
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-4 pb-6 overflow-x-auto h-full">
        {STATUSES.map((status) => (
          <IssueBoardColumn
            key={status}
            status={status}
            issues={grouped[status]}
          />
        ))}
      </div>

      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: "cubic-bezier(0.2, 0, 0, 1)",
        }}
      >
        {activeIssue && <IssueBoardCardOverlay issue={activeIssue} />}
      </DragOverlay>
    </DndContext>
  );
}
