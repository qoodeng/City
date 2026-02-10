import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderAsync } from "@/test/render";
import type { IssueWithLabels } from "@/types";
import { useUIStore } from "@/lib/stores/ui-store";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; className?: string; style?: React.CSSProperties; "data-issue-id"?: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock ContextMenu to just render trigger children directly
vi.mock("@/components/ui/context-menu", () => ({
  ContextMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ContextMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="context-menu" style={{ display: "none" }}>{children}</div>,
  ContextMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ContextMenuSub: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ContextMenuSubContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ContextMenuSubTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ContextMenuSeparator: () => <hr />,
  ContextMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Badge used by LabelBadge
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: { children: React.ReactNode; variant?: string; className?: string; style?: React.CSSProperties }) => (
    <span {...props}>{children}</span>
  ),
}));

import { IssueListRow } from "../issue-list-row";

const baseIssue: IssueWithLabels = {
  id: "issue-1",
  number: 42,
  title: "Fix authentication bug",
  description: null,
  status: "todo",
  priority: "high",
  assignee: null,
  projectId: null,
  parentId: null,
  dueDate: null,
  sortOrder: 0,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  labels: [],
  project: null,
};

beforeEach(() => {
  useUIStore.setState({
    focusedIssueId: null,
    selectedIssueIds: new Set(),
  });
});

describe("IssueListRow", () => {
  it("renders issue number and title", async () => {
    await renderAsync(<IssueListRow issue={baseIssue} />);
    expect(screen.getByText("CITY-42")).toBeInTheDocument();
    expect(screen.getByText("Fix authentication bug")).toBeInTheDocument();
  });

  it("renders label badges (max 3 + overflow count)", async () => {
    const issue: IssueWithLabels = {
      ...baseIssue,
      labels: [
        { id: "l1", name: "Bug", color: "#EF4444", description: null, createdAt: "", updatedAt: "" },
        { id: "l2", name: "Feature", color: "#3B82F6", description: null, createdAt: "", updatedAt: "" },
        { id: "l3", name: "Design", color: "#EC4899", description: null, createdAt: "", updatedAt: "" },
        { id: "l4", name: "Perf", color: "#F59E0B", description: null, createdAt: "", updatedAt: "" },
      ],
    };
    await renderAsync(<IssueListRow issue={issue} />);
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("Feature")).toBeInTheDocument();
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.queryByText("Perf")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("renders due date", async () => {
    const issue: IssueWithLabels = { ...baseIssue, dueDate: "2025-06-15" };
    await renderAsync(<IssueListRow issue={issue} />);
    expect(screen.getByText(/Jun/)).toBeInTheDocument();
  });

  it("renders project indicator", async () => {
    const issue: IssueWithLabels = {
      ...baseIssue,
      projectId: "proj-1",
      project: {
        id: "proj-1",
        name: "Core",
        description: null,
        status: "active",
        color: "#FFD700",
        icon: "folder",
        sortOrder: 0,
        createdAt: "",
        updatedAt: "",
      },
    };
    await renderAsync(<IssueListRow issue={issue} />);
    expect(screen.getByText("Core")).toBeInTheDocument();
  });

  it("renders assignee avatar", async () => {
    const issue: IssueWithLabels = { ...baseIssue, assignee: "Christian" };
    await renderAsync(<IssueListRow issue={issue} />);
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("does not render due date when none set", async () => {
    await renderAsync(<IssueListRow issue={baseIssue} />);
    const dates = screen.queryAllByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
    expect(dates).toHaveLength(0);
  });
});
