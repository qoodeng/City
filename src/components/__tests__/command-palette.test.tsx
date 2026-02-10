import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderAsync } from "@/test/render";
import { useUIStore } from "@/lib/stores/ui-store";
import { useIssueStore } from "@/lib/stores/issue-store";
import { useProjectStore } from "@/lib/stores/project-store";

// Mock CommandDialog to render inline
vi.mock("@/components/ui/command", () => ({
  CommandDialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="command-dialog">{children}</div> : null,
  CommandInput: ({ placeholder, value, onValueChange }: { placeholder?: string; value?: string; onValueChange?: (v: string) => void }) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      data-testid="command-input"
    />
  ),
  CommandList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandEmpty: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandGroup: ({ heading, children }: { heading?: string; children: React.ReactNode }) => (
    <div>
      {heading && <div>{heading}</div>}
      {children}
    </div>
  ),
  CommandItem: ({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) => (
    <button onClick={onSelect}>{children}</button>
  ),
  CommandSeparator: () => <hr />,
}));

import { CommandPalette } from "../command-palette";

beforeEach(() => {
  useUIStore.setState({
    commandPaletteOpen: false,
    createIssueDialogOpen: false,
  });
  useIssueStore.setState({ issues: [], loading: false });
  useProjectStore.setState({ projects: [], loading: false });
});

describe("CommandPalette", () => {
  it("returns null when commandPaletteOpen is false", async () => {
    const { container } = await renderAsync(<CommandPalette />);
    expect(container.innerHTML).toBe("");
  });

  it("shows actions and navigation when open with no search query", async () => {
    useUIStore.setState({ commandPaletteOpen: true });
    await renderAsync(<CommandPalette />);
    expect(screen.getByTestId("command-dialog")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("Navigation")).toBeInTheDocument();
    expect(screen.getByText("Create Issue")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("All Issues")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });

  it("shows search input with placeholder", async () => {
    useUIStore.setState({ commandPaletteOpen: true });
    await renderAsync(<CommandPalette />);
    expect(screen.getByPlaceholderText("Type a command or search...")).toBeInTheDocument();
  });

  it("shows issues in list when no search query", async () => {
    useUIStore.setState({ commandPaletteOpen: true });
    useIssueStore.setState({
      issues: [
        {
          id: "issue-1",
          number: 1,
          title: "Test Issue",
          description: null,
          status: "todo",
          priority: "high",
          assignee: null,
          projectId: null,
          parentId: null,
          dueDate: null,
          sortOrder: 0,
          createdAt: "",
          updatedAt: "",
          labels: [],
          project: null,
        },
      ],
    });
    await renderAsync(<CommandPalette />);
    expect(screen.getByText("Issues")).toBeInTheDocument();
    expect(screen.getByText("Test Issue")).toBeInTheDocument();
  });

  it("shows project navigation items", async () => {
    useUIStore.setState({ commandPaletteOpen: true });
    useProjectStore.setState({
      projects: [
        {
          id: "p1",
          name: "My Project",
          description: null,
          status: "active",
          color: "#FFD700",
          icon: "folder",
          sortOrder: 0,
          createdAt: "",
          updatedAt: "",
          issueCount: 0,
          doneCount: 0,
        },
      ],
    });
    await renderAsync(<CommandPalette />);
    expect(screen.getByText("My Project")).toBeInTheDocument();
  });
});
