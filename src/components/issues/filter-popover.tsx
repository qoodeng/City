"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FilterPopoverProps {
  label: string;
  activeCount?: number;
  children: React.ReactNode;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function FilterPopover({
  label,
  activeCount = 0,
  children,
  searchPlaceholder,
  emptyMessage,
}: FilterPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-7 text-xs gap-1",
            activeCount > 0 && "bg-city-yellow/15 border-city-yellow/40 text-city-yellow"
          )}
        >
          {label}
          {activeCount > 0 && (
            <Badge className="h-4 px-1 text-[11px] bg-city-yellow/20 text-city-yellow border-0">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <Command>
          {searchPlaceholder && <CommandInput placeholder={searchPlaceholder} />}
          <CommandList>
            {searchPlaceholder && (
              <CommandEmpty>{emptyMessage || `No ${label.toLowerCase()} found.`}</CommandEmpty>
            )}
            {children}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
