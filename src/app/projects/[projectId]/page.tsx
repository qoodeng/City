"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useDeferredLoading } from "@/lib/hooks/use-deferred-loading";
import Link from "next/link";
import { Settings, List, LayoutGrid, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IssueList } from "@/components/issues/issue-list";
import { useUIStore } from "@/lib/stores/ui-store";
import type { ProjectWithCounts } from "@/types";
import type { IssueWithLabels } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { viewMode, setViewMode, setCreateIssueDialogOpen } = useUIStore();

  const [project, setProject] = useState<ProjectWithCounts | null>(null);
  const [issues, setIssues] = useState<IssueWithLabels[]>([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useDeferredLoading(loading);

  // Synchronous reset when navigating between projects (same route type stays mounted)
  const [prevProjectId, setPrevProjectId] = useState(projectId);
  if (projectId !== prevProjectId) {
    setPrevProjectId(projectId);
    setProject(null);
    setIssues([]);
    setLoading(true);
  }

  const fetchData = useCallback(async () => {
    try {
      const [projectRes, issuesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/issues?projectId=${projectId}`),
      ]);
      if (projectRes.ok) setProject(await projectRes.json());
      if (issuesRes.ok) setIssues(await issuesRes.json());
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const progress =
    project && project.issueCount > 0
      ? Math.round((project.doneCount / project.issueCount) * 100)
      : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Project header */}
      <div className="shrink-0 border-b border-border">
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            {/* Left: project info */}
            <div className="flex items-start gap-4 min-w-0">
              {/* Color swatch */}
              <div
                className="w-10 h-10 rounded-lg shrink-0 mt-0.5 ring-1 ring-white/10"
                style={{ backgroundColor: project?.color ?? "#333" }}
              />
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight truncate">
                  {project?.name ?? "\u00A0"}
                </h1>
                {project?.description ? (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {project.description}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1.5 shrink-0">
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

              <Link href={`/projects/${projectId}/settings`}>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Settings className="w-3.5 h-3.5" />
                </Button>
              </Link>

              <Button
                size="sm"
                className="h-7 bg-city-yellow text-city-black hover:bg-city-yellow-bright"
                onClick={() => setCreateIssueDialogOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                New Issue
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          {project && project.issueCount > 0 && (
            <div className="mt-4 max-w-sm">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>
                  {project.doneCount} of {project.issueCount} done
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-city-surface overflow-hidden">
                <div
                  className="h-full rounded-full bg-city-yellow transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="h-0.5 hazard-stripe-thin" />
      </div>

      {/* Content — transitions per project */}
      {loading ? (
        showSkeleton ? (
          <div className="flex-1 p-6 space-y-4 animate-fade-in">
            <div className="h-64 w-full bg-city-surface animate-pulse rounded" />
          </div>
        ) : null
      ) : !project ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Project not found
        </div>
      ) : (
        <div key={projectId} className="flex-1 overflow-auto animate-fade-in pt-2">
          <IssueList issues={issues} />
        </div>
      )}
    </div>
  );
}
