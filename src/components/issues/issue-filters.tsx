"use client";

import { Button } from "@/components/ui/button";
import {
  CommandItem,
  CommandGroup,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { FilterPopover } from "./filter-popover";
import { StatusBadge } from "@/components/status-badge";
import { PriorityIcon } from "@/components/priority-icon";
import {
  STATUSES,
  STATUS_CONFIG,
  PRIORITIES,
  PRIORITY_CONFIG,
} from "@/lib/constants";
import { useLabelStore } from "@/lib/stores/label-store";
import { useProjectStore } from "@/lib/stores/project-store";
import { Check, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterProps {
  statusFilter: string[];
  setStatusFilter: (value: string[]) => void;
  priorityFilter: string[];
  setPriorityFilter: (value: string[]) => void;
  projectFilter: string | null;
  setProjectFilter: (value: string | null) => void;
  labelFilter: string[];
  setLabelFilter: (value: string[]) => void;
  search: string | null;
  setSearch: (value: string | null) => void;
  hasFilters: boolean;
  clearFilters: () => void;
}

export function IssueFilters({
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  projectFilter,
  setProjectFilter,
  labelFilter,
  setLabelFilter,
  search,
  setSearch,
  hasFilters,
  clearFilters,
}: FilterProps) {
  const { labels } = useLabelStore();
  const { projects } = useProjectStore();

  const toggleStatus = (status: string) => {
    setStatusFilter(
      statusFilter.includes(status)
        ? statusFilter.filter((s) => s !== status)
        : [...statusFilter, status]
    );
  };

  const togglePriority = (priority: string) => {
    setPriorityFilter(
      priorityFilter.includes(priority)
        ? priorityFilter.filter((p) => p !== priority)
        : [...priorityFilter, priority]
    );
  };

  const toggleLabel = (labelId: string) => {
    setLabelFilter(
      labelFilter.includes(labelId)
        ? labelFilter.filter((l) => l !== labelId)
        : [...labelFilter, labelId]
    );
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={search || ""}
          onChange={(e) => setSearch(e.target.value || null)}
          placeholder="Search issues..."
          className="h-7 w-48 pl-7 text-xs bg-transparent border-border"
        />
      </div>

      {/* Status filter */}
      <FilterPopover label="Status" activeCount={statusFilter.length}>
        <CommandGroup>
          {STATUSES.map((status) => (
            <CommandItem
              key={status}
              value={status}
              onSelect={() => toggleStatus(status)}
            >
              <StatusBadge status={status} size={12} />
              <span className="ml-2 text-xs">
                {STATUS_CONFIG[status].label}
              </span>
              {statusFilter.includes(status) && (
                <Check className="ml-auto w-3 h-3 text-city-yellow" />
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </FilterPopover>

      {/* Priority filter */}
      <FilterPopover label="Priority" activeCount={priorityFilter.length}>
        <CommandGroup>
          {PRIORITIES.map((priority) => (
            <CommandItem
              key={priority}
              value={priority}
              onSelect={() => togglePriority(priority)}
            >
              <PriorityIcon priority={priority} size={12} />
              <span className="ml-2 text-xs">
                {PRIORITY_CONFIG[priority].label}
              </span>
              {priorityFilter.includes(priority) && (
                <Check className="ml-auto w-3 h-3 text-city-yellow" />
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </FilterPopover>

      {/* Label filter */}
      {labels.length > 0 && (
        <FilterPopover
          label="Label"
          activeCount={labelFilter.length}
          searchPlaceholder="Search labels..."
          emptyMessage="No labels found."
        >
          <CommandGroup>
            {labels.map((label) => (
              <CommandItem
                key={label.id}
                value={label.name}
                onSelect={() => toggleLabel(label.id)}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full mr-2"
                  style={{ backgroundColor: label.color }}
                />
                <span className="text-xs">{label.name}</span>
                {labelFilter.includes(label.id) && (
                  <Check className="ml-auto w-3 h-3 text-city-yellow" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </FilterPopover>
      )}

      {/* Project filter */}
      {projects.length > 0 && (
        <FilterPopover label="Project" activeCount={projectFilter ? 1 : 0}>
          <CommandGroup>
            <CommandItem
              value="all"
              onSelect={() => setProjectFilter(null)}
            >
              <span className="text-xs">All Projects</span>
              {!projectFilter && (
                <Check className="ml-auto w-3 h-3 text-city-yellow" />
              )}
            </CommandItem>
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                value={project.name}
                onSelect={() => setProjectFilter(project.id)}
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm mr-2"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-xs">{project.name}</span>
                {projectFilter === project.id && (
                  <Check className="ml-auto w-3 h-3 text-city-yellow" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </FilterPopover>
      )}

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
          onClick={clearFilters}
        >
          <X className="w-3 h-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
