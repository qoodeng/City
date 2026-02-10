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
import { Check } from "lucide-react";
import { useIssueStore } from "@/lib/stores/issue-store";
import { StatusBadge } from "@/components/status-badge";
import type { Status } from "@/lib/constants";

export function ParentIssuePicker({
  value,
  currentIssueId,
  onChange,
}: {
  value: string | null;
  currentIssueId: string;
  onChange: (parentId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const { issues } = useIssueStore();

  // Filter out: the current issue, any issue that already has a parent, and any issue that has children (to enforce depth=1)
  const candidates = issues.filter(
    (i) => i.id !== currentIssueId && !i.parentId
  );

  const selected = issues.find((i) => i.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 justify-start gap-2 px-2 text-sm font-normal text-muted-foreground"
        >
          {selected ? (
            <span className="flex items-center gap-1.5">
              <StatusBadge status={selected.status as Status} size={12} />
              <span className="font-mono text-xs">City-{selected.number}</span>
              <span className="truncate max-w-32">{selected.title}</span>
            </span>
          ) : (
            "No parent"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search issues..." />
          <CommandList>
            <CommandEmpty>No matching issues.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                No parent
                {!value && (
                  <Check className="ml-auto w-3.5 h-3.5 text-city-yellow" />
                )}
              </CommandItem>
              {candidates.map((issue) => (
                <CommandItem
                  key={issue.id}
                  value={`City-${issue.number} ${issue.title}`}
                  onSelect={() => {
                    onChange(issue.id);
                    setOpen(false);
                  }}
                >
                  <StatusBadge status={issue.status as Status} size={12} />
                  <span className="font-mono text-xs ml-1.5 shrink-0">
                    City-{issue.number}
                  </span>
                  <span className="ml-1.5 truncate">{issue.title}</span>
                  {value === issue.id && (
                    <Check className="ml-auto w-3.5 h-3.5 text-city-yellow shrink-0" />
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
