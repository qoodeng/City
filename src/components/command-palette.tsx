"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/lib/stores/ui-store";
import { useIssueStore } from "@/lib/stores/issue-store";
import { useProjectStore } from "@/lib/stores/project-store";
import { StatusBadge } from "@/components/status-badge";
import { PriorityIcon } from "@/components/priority-icon";
import type { Status, Priority } from "@/lib/constants";
import type { FtsSearchResult } from "@/types";
import {
  Plus,
  CircleDot,
  Folder,
  FolderPlus,
  Home,
} from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";

// Wrapper avoids heavy store subscriptions when palette is closed (rule: rerender-derived-state)
export function CommandPalette() {
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);

  if (!commandPaletteOpen) return null;

  return <CommandPaletteOpen onOpenChange={setCommandPaletteOpen} />;
}

function CommandPaletteOpen({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const setCreateIssueDialogOpen = useUIStore((s) => s.setCreateIssueDialogOpen);
  const issues = useIssueStore((s) => s.issues);
  const projects = useProjectStore((s) => s.projects);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FtsSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/issues/search?q=${encodeURIComponent(q)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(searchQuery), 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, doSearch]);

  const hasSearch = searchQuery.trim().length > 0;
  const showSearchResults = hasSearch && searchResults.length > 0;
  const showStaticIssues = !hasSearch && issues.length > 0;

  return (
    <CommandDialog open onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {searching ? "Searching..." : "No results found."}
        </CommandEmpty>

        {showSearchResults && (
          <>
            <CommandGroup heading="Search Results">
              {searchResults.map((result) => (
                <CommandItem
                  key={result.id}
                  value={`search-${result.id} City-${result.number} ${result.title}`}
                  onSelect={() => {
                    close();
                    router.push(`/issues/${result.id}`);
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <StatusBadge
                      status={result.status as Status}
                      size={12}
                    />
                    <PriorityIcon
                      priority={result.priority as Priority}
                      size={12}
                    />
                    <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                      City-{result.number}
                    </span>
                    <span
                      className="truncate"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(result.titleSnippet || result.title),
                      }}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              close();
              setCreateIssueDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Issue
            <span className="ml-auto text-xs text-muted-foreground">C</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              close();
              router.push("/projects");
            }}
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Create Project
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => {
              close();
              router.push("/");
            }}
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </CommandItem>
          <CommandItem
            onSelect={() => {
              close();
              router.push("/issues");
            }}
          >
            <CircleDot className="w-4 h-4 mr-2" />
            All Issues
          </CommandItem>
          <CommandItem
            onSelect={() => {
              close();
              router.push("/projects");
            }}
          >
            <Folder className="w-4 h-4 mr-2" />
            Projects
          </CommandItem>
          {projects.map((project) => (
            <CommandItem
              key={project.id}
              onSelect={() => {
                close();
                router.push(`/projects/${project.id}`);
              }}
            >
              <div
                className="w-3 h-3 rounded-sm mr-2"
                style={{ backgroundColor: project.color }}
              />
              {project.name}
            </CommandItem>
          ))}
        </CommandGroup>

        {showStaticIssues && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Issues">
              {issues.slice(0, 20).map((issue) => (
                <CommandItem
                  key={issue.id}
                  value={`City-${issue.number} ${issue.title}`}
                  onSelect={() => {
                    close();
                    router.push(`/issues/${issue.id}`);
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <StatusBadge
                      status={issue.status as Status}
                      size={12}
                    />
                    <PriorityIcon
                      priority={issue.priority as Priority}
                      size={12}
                    />
                    <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                      City-{issue.number}
                    </span>
                    <span className="truncate">{issue.title}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
