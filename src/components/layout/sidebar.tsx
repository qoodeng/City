"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CircleDot,
  Folder,
  ChevronLeft,
  ChevronRight,
  Plus,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui-store";
import { useProjectStore } from "@/lib/stores/project-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SyncIndicator } from "@/components/sync-indicator";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/issues", label: "All Issues", icon: CircleDot },
  { href: "/projects", label: "Projects", icon: Folder },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, setCreateIssueDialogOpen } =
    useUIStore();
  const { projects } = useProjectStore();

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-200",
        sidebarCollapsed ? "w-12" : "w-56"
      )}
    >
      {/* Drag region for Electron traffic lights */}
      <div className="h-8 shrink-0 [-webkit-app-region:drag]" />

      {/* Branding */}
      <div className="flex items-center h-12 px-3 border-b border-border">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <svg className="w-6 h-6 shrink-0" viewBox="0 0 128 128">
            <defs>
              <clipPath id="sidebarClip"><circle cx="64" cy="64" r="60" /></clipPath>
            </defs>
            <circle cx="64" cy="64" r="60" fill="#0F0F0F" />
            <g clipPath="url(#sidebarClip)">
              <path d="M64,4 A60,60 0 0,0 4,64 L64,64 Z" fill="#FFD700" />
              <path d="M64,124 A60,60 0 0,0 124,64 L64,64 Z" fill="#FFD700" />
            </g>
          </svg>
          {!sidebarCollapsed && (
            <span className="font-bold text-city-yellow tracking-wider text-sm">
              City
            </span>
          )}
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Create Issue */}
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-8 hover:bg-city-yellow/10 hover:text-city-yellow"
                  onClick={() => setCreateIssueDialogOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Create Issue (C)</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full h-8 justify-start gap-2 text-sm text-muted-foreground hover:bg-city-yellow/10 hover:text-city-yellow"
              onClick={() => setCreateIssueDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Create Issue
            </Button>
          )}

          {/* Nav items */}
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href);
            const Icon = item.icon;

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center h-8 rounded-md transition-colors",
                        isActive
                          ? "bg-city-yellow/10 text-city-yellow"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 h-8 px-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-city-yellow/10 text-city-yellow"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}

          {/* Projects list */}
          {!sidebarCollapsed && projects.length > 0 && (
            <div className="pt-4">
              <div className="px-2 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Projects
              </div>
              {projects.map((project) => {
                const isActive = pathname === `/projects/${project.id}`;
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className={cn(
                      "flex items-center gap-2 h-7 px-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-city-yellow/10 text-city-yellow"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate">{project.name}</span>
                    <span className="ml-auto text-xs opacity-50">
                      {project.issueCount}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Sync indicator + Help + Collapse toggle */}
      <div className="border-t border-border p-2">
        {!sidebarCollapsed && <SyncIndicator />}
        <div className="flex items-center gap-1">
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 flex-1 text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("city:keyboard-help"))
                  }
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Keyboard Shortcuts (?)</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 text-muted-foreground hover:text-foreground"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("city:keyboard-help"))
              }
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 flex-1 text-muted-foreground hover:text-foreground"
            onClick={toggleSidebar}
            data-testid="sidebar-collapse"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
