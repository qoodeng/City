"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { PriorityIcon } from "@/components/priority-icon";
import {
  STATUSES,
  STATUS_CONFIG,
  PRIORITIES,
  PRIORITY_CONFIG,
  type Status,
  type Priority,
} from "@/lib/constants";
import type { Label, Project } from "@/lib/db/schema";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusPicker({
  value,
  onChange,
}: {
  value: Status;
  onChange: (status: Status) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 justify-start gap-2 px-2 text-sm font-normal"
        >
          <StatusBadge status={value} showLabel size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <Command>
          <CommandInput placeholder="Change status..." />
          <CommandList>
            <CommandEmpty>No status found.</CommandEmpty>
            <CommandGroup>
              {STATUSES.map((status) => (
                <CommandItem
                  key={status}
                  value={status}
                  onSelect={() => {
                    onChange(status);
                    setOpen(false);
                  }}
                >
                  <StatusBadge status={status} size={14} />
                  <span className="ml-2">{STATUS_CONFIG[status].label}</span>
                  {value === status && (
                    <Check className="ml-auto w-3.5 h-3.5 text-city-yellow" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function PriorityPicker({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (priority: Priority) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 justify-start gap-2 px-2 text-sm font-normal"
        >
          <PriorityIcon priority={value} showLabel size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <Command>
          <CommandInput placeholder="Change priority..." />
          <CommandList>
            <CommandEmpty>No priority found.</CommandEmpty>
            <CommandGroup>
              {PRIORITIES.map((priority) => (
                <CommandItem
                  key={priority}
                  value={priority}
                  onSelect={() => {
                    onChange(priority);
                    setOpen(false);
                  }}
                >
                  <PriorityIcon priority={priority} size={14} />
                  <span className="ml-2">
                    {PRIORITY_CONFIG[priority].label}
                  </span>
                  {value === priority && (
                    <Check className="ml-auto w-3.5 h-3.5 text-city-yellow" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function LabelPicker({
  labels,
  selectedIds,
  onChange,
}: {
  labels: Label[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id]
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 justify-start gap-2 px-2 text-sm font-normal text-muted-foreground"
        >
          {selectedIds.length > 0
            ? `${selectedIds.length} label${selectedIds.length > 1 ? "s" : ""}`
            : "Add labels"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search labels..." />
          <CommandList>
            <CommandEmpty>No labels found.</CommandEmpty>
            <CommandGroup>
              {labels.map((label) => (
                <CommandItem
                  key={label.id}
                  value={label.name}
                  onSelect={() => toggle(label.id)}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                  {selectedIds.includes(label.id) && (
                    <Check className="ml-auto w-3.5 h-3.5 text-city-yellow" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ProjectPicker({
  projects,
  value,
  onChange,
}: {
  projects: Project[];
  value: string | null;
  onChange: (projectId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = projects.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 justify-start gap-2 px-2 text-sm font-normal text-muted-foreground"
        >
          {selected ? (
            <>
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: selected.color }}
              />
              {selected.name}
            </>
          ) : (
            "No project"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search projects..." />
          <CommandList>
            <CommandEmpty>No projects found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                No project
                {!value && (
                  <Check className="ml-auto w-3.5 h-3.5 text-city-yellow" />
                )}
              </CommandItem>
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.name}
                  onSelect={() => {
                    onChange(project.id);
                    setOpen(false);
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-sm mr-2"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                  {value === project.id && (
                    <Check className="ml-auto w-3.5 h-3.5 text-city-yellow" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function AssigneeInput({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (assignee: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value || "");

  const save = () => {
    onChange(text.trim() || null);
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setText(value || "");
            setEditing(false);
          }
        }}
        className="h-8 text-sm bg-transparent"
        autoFocus
        placeholder="Assignee name"
      />
    );
  }

  return (
    <Button
      variant="ghost"
      className="h-8 justify-start px-2 text-sm font-normal text-muted-foreground"
      onClick={() => setEditing(true)}
    >
      {value || "Unassigned"}
    </Button>
  );
}
