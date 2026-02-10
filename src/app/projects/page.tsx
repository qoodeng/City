"use client";

import { useProjectStore } from "@/lib/stores/project-store";
import { useDeferredLoading } from "@/lib/hooks/use-deferred-loading";
import { PageHeader } from "@/components/layout/header";
import { ProjectCreateDialog } from "@/components/projects/project-create-dialog";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";

export default function ProjectsPage() {
  const { projects, loading } = useProjectStore();
  const showSkeleton = useDeferredLoading(loading);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Projects"
        description={`${projects.length} projects`}
        actions={<ProjectCreateDialog />}
      />

      <div className="flex-1 overflow-auto p-6">
        {loading && showSkeleton ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-lg bg-city-surface animate-pulse"
              />
            ))}
          </div>
        ) : loading ? null : projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            subtitle="Create a project to organize your issues"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, i) => {
              const progress =
                project.issueCount > 0
                  ? Math.round(
                      (project.doneCount / project.issueCount) * 100
                    )
                  : 0;

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group block rounded-lg border border-border bg-card p-4 transition-colors hover:border-city-yellow/30 hover:bg-city-surface-hover animate-stagger-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: project.color }}
                    />
                    <h3 className="font-medium text-sm">{project.name}</h3>
                    <span className="ml-auto text-xs text-muted-foreground capitalize">
                      {project.status}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {project.doneCount}/{project.issueCount} issues
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-city-surface overflow-hidden">
                      <div
                        className="h-full rounded-full bg-city-yellow transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
