"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { PriorityIcon } from "@/components/priority-icon";
import { LabelBadge } from "@/components/label-badge";
import { useUIStore } from "@/lib/stores/ui-store";
import { useIssueStore } from "@/lib/stores/issue-store";
import { useDeferredLoading } from "@/lib/hooks/use-deferred-loading";
import {
  STATUSES,
  STATUS_CONFIG,
  type Status,
  type Priority,
} from "@/lib/constants";
import type { IssueWithLabels } from "@/types";
import { PageHeader } from "@/components/layout/header";
import { Plus, LayoutGrid, AlertTriangle, Calendar, Clock } from "lucide-react";

interface DashboardData {
  dueThisWeek: IssueWithLabels[];
  recentlyUpdated: IssueWithLabels[];
  staleIssues: IssueWithLabels[];
  statusDistribution: Record<string, number>;
  totalIssues: number;
}

function IssueRow({ issue, animationIndex = 0 }: { issue: IssueWithLabels; animationIndex?: number }) {
  const focusedIssueId = useUIStore((state) => state.focusedIssueId);
  const isFocused = focusedIssueId === issue.id;

  return (
    <Link
      href={`/issues/${issue.id}`}
      className={`flex items-center gap-3 h-9 px-3 text-sm border-b border-border/50 last:border-0 hover:bg-city-surface-hover transition-colors animate-stagger-in ${isFocused ? "bg-city-yellow/10 ring-1 ring-inset ring-city-yellow/50 border-l-2 !border-l-city-yellow" : ""
        }`}
      style={{ animationDelay: `${animationIndex * 30}ms` }}
      data-issue-id={issue.id}
    >
      <StatusBadge status={issue.status as Status} size={12} />
      <PriorityIcon priority={issue.priority as Priority} size={12} />
      <span className="text-xs text-muted-foreground font-mono shrink-0">
        City-{issue.number}
      </span>
      <span className="flex-1 truncate">{issue.title}</span>
      {issue.labels.length > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          {issue.labels.slice(0, 2).map((label) => (
            <LabelBadge key={label.id} name={label.name} color={label.color} />
          ))}
        </div>
      )}
      {issue.dueDate && (
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(issue.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      )}
    </Link>
  );
}

import { IndustrialSkeleton } from "@/components/ui/industrial-skeleton";

const dashboardLoadingSkeleton = (
  <div className="flex-1 overflow-auto p-6 space-y-6 animate-fade-in">
    <IndustrialSkeleton className="h-8 w-48 rounded" />
    <IndustrialSkeleton className="h-4 rounded" />
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <IndustrialSkeleton key={i} className="h-48 rounded-md" />
      ))}
    </div>
  </div>
);

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useDeferredLoading(loading);
  const { setCreateIssueDialogOpen } = useUIStore();
  const setNavigationIds = useIssueStore((state) => state.setNavigationIds);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          setData(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (data) {
      const ids = [
        ...data.dueThisWeek.map((i) => i.id),
        ...data.staleIssues.map((i) => i.id),
        ...data.recentlyUpdated.map((i) => i.id),
      ];
      // Deduplicate to avoid jumping loops
      const uniqueIds = Array.from(new Set(ids));
      setNavigationIds(uniqueIds);
    }
    return () => setNavigationIds([]);
  }, [data, setNavigationIds]);

  if (loading) {
    if (!showSkeleton) return null;
    return dashboardLoadingSkeleton;
  }

  if (!data) return null;

  const total = data.totalIssues || 1; // Prevent division by zero

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Dashboard"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setCreateIssueDialogOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              New Issue
            </Button>
            <Link href="/issues">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" />
                Board
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 overflow-auto animate-fade-in p-6 space-y-6 max-w-5xl">
        {/* Status Overview Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status Overview
            </h2>
            <span className="text-xs text-muted-foreground">
              {data.totalIssues} total issues
            </span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-city-surface">
            {STATUSES.map((status) => {
              const count = data.statusDistribution[status] || 0;
              if (count === 0) return null;
              const pct = (count / total) * 100;
              return (
                <div
                  key={status}
                  className="h-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: STATUS_CONFIG[status].color,
                  }}
                  title={`${STATUS_CONFIG[status].label}: ${count}`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 mt-2">
            {STATUSES.map((status) => {
              const count = data.statusDistribution[status] || 0;
              return (
                <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: STATUS_CONFIG[status].color }}
                  />
                  {STATUS_CONFIG[status].label}
                  <span className="font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Due This Week */}
          <div className="rounded-md border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-city-surface/50 border-b border-border">
              <Calendar className="w-3.5 h-3.5 text-city-yellow" />
              <h2 className="text-xs font-medium">Due This Week</h2>
              <span className="text-xs text-muted-foreground ml-auto">
                {data.dueThisWeek.length}
              </span>
            </div>
            {data.dueThisWeek.length > 0 ? (
              data.dueThisWeek.map((issue, i) => (
                <IssueRow key={issue.id} issue={issue} animationIndex={i} />
              ))
            ) : (
              <div className="p-4 text-xs text-muted-foreground/60 text-center">
                No issues due this week
              </div>
            )}
          </div>

          {/* Stale Issues */}
          <div className="rounded-md border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-city-surface/50 border-b border-border">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
              <h2 className="text-xs font-medium">Stale Issues</h2>
              <span className="text-xs text-muted-foreground ml-auto">
                {data.staleIssues.length}
              </span>
            </div>
            {data.staleIssues.length > 0 ? (
              data.staleIssues.map((issue, i) => (
                <IssueRow key={issue.id} issue={issue} animationIndex={i} />
              ))
            ) : (
              <div className="p-4 text-xs text-muted-foreground/60 text-center">
                No stale issues
              </div>
            )}
          </div>
        </div>

        {/* Recently Updated */}
        <div className="rounded-md border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-city-surface/50 border-b border-border">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <h2 className="text-xs font-medium">Recently Updated</h2>
          </div>
          {data.recentlyUpdated.length > 0 ? (
            data.recentlyUpdated.map((issue, i) => (
              <IssueRow key={issue.id} issue={issue} animationIndex={i} />
            ))
          ) : (
            <div className="p-4 text-xs text-muted-foreground/60 text-center">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
