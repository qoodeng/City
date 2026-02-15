"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface PropertyPickerOption<T> {
  value: T;
  label: string;
  key: string;
  component: React.ReactNode;
}

interface PropertyPickerProps<T> {
  options: PropertyPickerOption<T>[];
  value: T | null;
  onSelect: (value: T) => void;
  trigger: React.ReactNode;
  searchPlaceholder?: string;
  emptyMessage?: string;
  width?: string;
  closeOnSelect?: boolean;
  className?: string;
  isSelected?: (optionValue: T, currentValue: T | null) => boolean;
}

export function PropertyPicker<T>({
  options,
  value,
  onSelect,
  trigger,
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  width = "w-48",
  closeOnSelect = true,
  className,
  isSelected = (opt, val) => opt === val,
}: PropertyPickerProps<T>) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-8 justify-start gap-2 px-2 text-sm font-normal",
            className
          )}
        >
          {trigger}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0", width)} align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const selected = isSelected(option.value, value);
                return (
                  <CommandItem
                    key={option.key}
                    value={option.label}
                    onSelect={() => {
                      onSelect(option.value);
                      if (closeOnSelect) {
                        setOpen(false);
                      }
                    }}
                  >
                    {option.component}
                    {selected && (
                      <Check className="ml-auto w-3.5 h-3.5 text-city-yellow" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
