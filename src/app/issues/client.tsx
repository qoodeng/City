"use client";

import { useEffect } from "react";
import { useIssueStore } from "@/lib/stores/issue-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { useFilters } from "@/lib/hooks/use-filters";
import { useDeferredLoading } from "@/lib/hooks/use-deferred-loading";
import { PageHeader } from "@/components/layout/header";
import { IssueList } from "@/components/issues/issue-list";
import dynamic from "next/dynamic";

const IssueBoard = dynamic(
  () =>
    import("@/components/issues/issue-board").then((m) => m.IssueBoard),
  {
    ssr: false,
    loading: () => (
      <div className="flex gap-4 p-4 h-full">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-72 shrink-0 bg-city-surface/50 rounded-lg animate-pulse h-64" />
        ))}
      </div>
    ),
  }
);
import { IssueFilters } from "@/components/issues/issue-filters";
import { IssueSort } from "@/components/issues/issue-sort";
import { Button } from "@/components/ui/button";
import { List, LayoutGrid, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function IssuesPageClient() {
  const { issues, loading, fetchIssues } = useIssueStore();
  const showSkeleton = useDeferredLoading(loading);
  const { viewMode, setViewMode, setCreateIssueDialogOpen } = useUIStore();
  const filters = useFilters();

  // Refetch when filters change
  const { statusFilter, priorityFilter, projectFilter, labelFilter, search, sort, order, buildSearchParams } = filters;
  useEffect(() => {
    const sp = buildSearchParams();
    const fetchWithParams = async () => {
      const res = await fetch(`/api/issues?${sp.toString()}`);
      if (res.ok) {
        const data = await res.json();
        useIssueStore.getState().setIssues(data);
      }
    };
    fetchWithParams();
  }, [statusFilter, priorityFilter, projectFilter, labelFilter, search, sort, order, buildSearchParams]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="All Issues"
        description={`${issues.length} issues`}
        actions={
          <div className="flex items-center gap-2">
            <IssueSort
              sort={filters.sort}
              order={filters.order}
              onSortChange={filters.setSort}
              onOrderChange={filters.setOrder}
            />

            <div className="flex items-center border border-border rounded-md">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 rounded-r-none ${viewMode === "list" ? "bg-accent" : ""}`}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>List view (1)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 rounded-l-none ${viewMode === "board" ? "bg-accent" : ""}`}
                    onClick={() => setViewMode("board")}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Board view (2)</TooltipContent>
              </Tooltip>
            </div>

            <Button
              size="sm"
              className="h-7 bg-city-yellow text-city-black hover:bg-city-yellow-bright"
              onClick={() => setCreateIssueDialogOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Issue
            </Button>
          </div>
        }
      />

      <IssueFilters
        statusFilter={filters.statusFilter}
        setStatusFilter={filters.setStatusFilter}
        priorityFilter={filters.priorityFilter}
        setPriorityFilter={filters.setPriorityFilter}
        projectFilter={filters.projectFilter}
        setProjectFilter={filters.setProjectFilter}
        labelFilter={filters.labelFilter}
        setLabelFilter={filters.setLabelFilter}
        search={filters.search}
        setSearch={filters.setSearch}
        hasFilters={filters.hasFilters}
        clearFilters={filters.clearFilters}
      />

      <div className="flex-1 overflow-auto">
        {loading && showSkeleton ? (
          <div className="space-y-0 animate-fade-in">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-10 px-4 border-b border-border/50 flex items-center gap-3"
              >
                <div className="w-3.5 h-3.5 rounded bg-city-surface animate-pulse" />
                <div className="w-14 h-3 rounded bg-city-surface animate-pulse" />
                <div className="w-3.5 h-3.5 rounded bg-city-surface animate-pulse" />
                <div className="flex-1 h-3 rounded bg-city-surface animate-pulse max-w-64" />
              </div>
            ))}
          </div>
        ) : !loading && viewMode === "board" ? (
          <div className="animate-fade-in h-full">
            <IssueBoard issues={issues} />
          </div>
        ) : !loading ? (
          <div className="animate-fade-in">
            <IssueList issues={issues} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
