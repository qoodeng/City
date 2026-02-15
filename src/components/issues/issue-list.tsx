"use client";

import { useMemo, useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { STATUS_CONFIG, STATUSES, type Status } from "@/lib/constants";
import { StatusBadge } from "@/components/status-badge";
import { IssueListRow } from "./issue-list-row";
import { IssueSelectionBar } from "./issue-selection-bar";
import type { IssueWithLabels } from "@/types";
import { EmptyState } from "@/components/empty-state";
import { useIssueStore } from "@/lib/stores/issue-store";

export function IssueList({ issues }: { issues: IssueWithLabels[] }) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );
  const setNavigationIds = useIssueStore((state) => state.setNavigationIds);

  const grouped = useMemo(() => {
    const groups: Record<string, IssueWithLabels[]> = {};
    for (const status of STATUSES) {
      groups[status] = [];
    }
    // Build parent-child map for issues in same status group
    const childrenByParent = new Map<string, IssueWithLabels[]>();
    const issueStatusMap = new Map<string, string>();
    for (const issue of issues) {
      issueStatusMap.set(issue.id, issue.status);
    }
    for (const issue of issues) {
      if (issue.parentId && issueStatusMap.get(issue.parentId) === issue.status) {
        const children = childrenByParent.get(issue.parentId) || [];
        children.push(issue);
        childrenByParent.set(issue.parentId, children);
      }
    }

    for (const issue of issues) {
      const status = issue.status as Status;
      // Skip children that will be nested under their parent in the same group
      if (issue.parentId && issueStatusMap.get(issue.parentId) === issue.status) {
        continue;
      }
      if (groups[status]) {
        groups[status].push(issue);
        // Add children right after the parent
        const children = childrenByParent.get(issue.id);
        if (children) {
          for (const child of children) {
            groups[status].push({ ...child, _depth: 1 } as IssueWithLabels & { _depth: number });
          }
        }
      } else {
        groups.backlog.push(issue);
      }
    }
    return groups;
  }, [issues]);

  // Sync displayed IDs for J/K navigation
  useEffect(() => {
    const ids: string[] = [];
    for (const status of STATUSES) {
      // Skip if group is collapsed
      if (collapsedGroups.has(status)) continue;

      const groupIssues = grouped[status];
      if (!groupIssues) continue;

      for (const issue of groupIssues) {
        ids.push(issue.id);
      }
    }
    setNavigationIds(ids);
    return () => setNavigationIds([]);
  }, [grouped, collapsedGroups, setNavigationIds]);

  const toggleGroup = (status: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  if (issues.length === 0) {
    return (
      <EmptyState
        title="No issues yet"
        subtitle="Press C to create one"
      />
    );
  }

  return (
    <div className="flex-1">
      <IssueSelectionBar />
      {STATUSES.map((status) => {
        const statusIssues = grouped[status];
        if (statusIssues.length === 0) return null;
        const isCollapsed = collapsedGroups.has(status);
        const config = STATUS_CONFIG[status];

        return (
          <div key={status}>
            <button
              onClick={() => toggleGroup(status)}
              className="flex items-center gap-2 w-full h-8 px-4 text-xs font-medium text-muted-foreground hover:bg-city-surface-hover transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              <StatusBadge status={status} size={12} />
              <span>{config.label}</span>
              <span className="text-xs opacity-50">{statusIssues.length}</span>
            </button>
            {!isCollapsed &&
              statusIssues.map((issue, i) => (
                <IssueListRow key={issue.id} issue={issue} depth={(issue as IssueWithLabels & { _depth?: number })._depth || 0} animationIndex={i} />
              ))}
          </div>
        );
      })}
    </div>
  );
}
