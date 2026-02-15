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
import { PropertyPicker, type PropertyPickerOption } from "./property-picker";

export function StatusPicker({
  value,
  onChange,
}: {
  value: Status;
  onChange: (status: Status) => void;
}) {
  const options: PropertyPickerOption<Status>[] = STATUSES.map((status) => ({
    value: status,
    label: STATUS_CONFIG[status].label,
    key: status,
    component: (
      <>
        <StatusBadge status={status} size={14} />
        <span className="ml-2">{STATUS_CONFIG[status].label}</span>
      </>
    ),
  }));

  return (
    <PropertyPicker
      value={value}
      onSelect={onChange}
      options={options}
      trigger={<StatusBadge status={value} showLabel size={14} />}
      searchPlaceholder="Change status..."
      emptyMessage="No status found."
    />
  );
}

export function PriorityPicker({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (priority: Priority) => void;
}) {
  const options: PropertyPickerOption<Priority>[] = PRIORITIES.map((priority) => ({
    value: priority,
    label: PRIORITY_CONFIG[priority].label,
    key: priority,
    component: (
      <>
        <PriorityIcon priority={priority} size={14} />
        <span className="ml-2">{PRIORITY_CONFIG[priority].label}</span>
      </>
    ),
  }));

  return (
    <PropertyPicker
      value={value}
      onSelect={onChange}
      options={options}
      trigger={<PriorityIcon priority={value} showLabel size={14} />}
      searchPlaceholder="Change priority..."
      emptyMessage="No priority found."
    />
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
  const selected = projects.find((p) => p.id === value);

  const options: PropertyPickerOption<string | null>[] = [
    {
      value: null,
      label: "No project",
      key: "none",
      component: "No project",
    },
    ...projects.map((project) => ({
      value: project.id,
      label: project.name,
      key: project.id,
      component: (
        <>
          <div
            className="w-2.5 h-2.5 rounded-sm mr-2"
            style={{ backgroundColor: project.color }}
          />
          {project.name}
        </>
      ),
    })),
  ];

  const trigger = selected ? (
    <>
      <div
        className="w-2.5 h-2.5 rounded-sm"
        style={{ backgroundColor: selected.color }}
      />
      {selected.name}
    </>
  ) : (
    "No project"
  );

  return (
    <PropertyPicker
      value={value}
      onSelect={onChange}
      options={options}
      trigger={trigger}
      searchPlaceholder="Search projects..."
      emptyMessage="No projects found."
      className="text-muted-foreground"
    />
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
