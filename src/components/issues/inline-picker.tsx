"use client";

import { useEffect, useRef } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import { useUIStore } from "@/lib/stores/ui-store";
import { useIssueStore } from "@/lib/stores/issue-store";
import { useLabelStore } from "@/lib/stores/label-store";
import { useProjectStore } from "@/lib/stores/project-store";
import { useKeyboardStore } from "@/lib/stores/keyboard-store";
import { StatusBadge } from "@/components/status-badge";
import { PriorityIcon } from "@/components/priority-icon";
import { Check } from "lucide-react";
import {
  STATUSES,
  STATUS_CONFIG,
  PRIORITIES,
  PRIORITY_CONFIG,
  type Status,
  type Priority,
} from "@/lib/constants";
export function InlinePicker() {
  const { inlinePicker, setInlinePicker } = useUIStore();
  const updateIssue = useIssueStore((s) => s.updateIssue);
  const issue = useIssueStore((s) =>
    inlinePicker ? s.issues.find((i) => i.id === inlinePicker.issueId) ?? null : null
  );
  const { labels } = useLabelStore();
  const { projects } = useProjectStore();
  const keyboard = useKeyboardStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inlinePicker) return;

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setInlinePicker(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inlinePicker, setInlinePicker]);

  if (!inlinePicker || !issue) return null;

  // Position near the focused issue element
  const el = document.querySelector(`[data-issue-id="${inlinePicker.issueId}"]`);
  const rect = el?.getBoundingClientRect();
  const top = rect ? rect.bottom + 4 : 200;
  const left = rect ? Math.min(rect.left + 40, window.innerWidth - 260) : 200;

  const handleStatusSelect = (status: string) => {
    updateIssue(issue.id, { status });
    keyboard.setLastAction(
      () => {
        const current = useUIStore.getState().focusedIssueId;
        if (current) useIssueStore.getState().updateIssue(current, { status });
      },
      `Set status to ${STATUS_CONFIG[status as Status]?.label || status}`
    );
    setInlinePicker(null);
  };

  const handlePrioritySelect = (priority: string) => {
    updateIssue(issue.id, { priority });
    keyboard.setLastAction(
      () => {
        const current = useUIStore.getState().focusedIssueId;
        if (current) useIssueStore.getState().updateIssue(current, { priority });
      },
      `Set priority to ${PRIORITY_CONFIG[priority as Priority]?.label || priority}`
    );
    setInlinePicker(null);
  };

  const handleLabelToggle = (labelId: string) => {
    const currentIds = issue.labels.map((l) => l.id);
    const newIds = currentIds.includes(labelId)
      ? currentIds.filter((id) => id !== labelId)
      : [...currentIds, labelId];
    updateIssue(issue.id, { labelIds: newIds });
  };

  const handleProjectSelect = (projectId: string | null) => {
    updateIssue(issue.id, { projectId });
    keyboard.setLastAction(
      () => {
        const current = useUIStore.getState().focusedIssueId;
        if (current) useIssueStore.getState().updateIssue(current, { projectId });
      },
      projectId ? "Set project" : "Remove project"
    );
    setInlinePicker(null);
  };

  return (
    <div
      ref={ref}
      className="fixed z-50 w-56 rounded-md border border-border bg-popover shadow-lg overflow-hidden"
      style={{ top, left }}
    >
      <Command>
        <CommandInput
          placeholder={
            inlinePicker.type === "status"
              ? "Set status..."
              : inlinePicker.type === "priority"
              ? "Set priority..."
              : inlinePicker.type === "label"
              ? "Toggle label..."
              : "Set project..."
          }
          autoFocus
        />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup>
            {inlinePicker.type === "status" &&
              STATUSES.map((status) => (
                <CommandItem
                  key={status}
                  value={status}
                  onSelect={() => handleStatusSelect(status)}
                >
                  <StatusBadge status={status} size={14} />
                  <span className="ml-2">{STATUS_CONFIG[status].label}</span>
                  {issue.status === status && (
                    <Check className="ml-auto w-3.5 h-3.5 text-city-yellow" />
                  )}
                </CommandItem>
              ))}

            {inlinePicker.type === "priority" &&
              PRIORITIES.map((priority) => (
                <CommandItem
                  key={priority}
                  value={priority}
                  onSelect={() => handlePrioritySelect(priority)}
                >
                  <PriorityIcon priority={priority} size={14} />
                  <span className="ml-2">{PRIORITY_CONFIG[priority].label}</span>
                  {issue.priority === priority && (
                    <Check className="ml-auto w-3.5 h-3.5 text-city-yellow" />
                  )}
                </CommandItem>
              ))}

            {inlinePicker.type === "label" &&
              labels.map((label) => (
                <CommandItem
                  key={label.id}
                  value={label.name}
                  onSelect={() => handleLabelToggle(label.id)}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                  {issue.labels.some((l) => l.id === label.id) && (
                    <Check className="ml-auto w-3.5 h-3.5 text-city-yellow" />
                  )}
                </CommandItem>
              ))}

            {inlinePicker.type === "project" && (
              <>
                <CommandItem
                  value="no-project"
                  onSelect={() => handleProjectSelect(null)}
                >
                  No project
                  {!issue.projectId && (
                    <Check className="ml-auto w-3.5 h-3.5 text-city-yellow" />
                  )}
                </CommandItem>
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.name}
                    onSelect={() => handleProjectSelect(project.id)}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-sm mr-2"
                      style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                    {issue.projectId === project.id && (
                      <Check className="ml-auto w-3.5 h-3.5 text-city-yellow" />
                    )}
                  </CommandItem>
                ))}
              </>
            )}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
