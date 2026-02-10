import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderAsync } from "@/test/render";
import { useUIStore } from "@/lib/stores/ui-store";
import { useIssueStore } from "@/lib/stores/issue-store";
import { useLabelStore } from "@/lib/stores/label-store";
import { useProjectStore } from "@/lib/stores/project-store";
import { useUndoStore } from "@/lib/stores/undo-store";

// Mock Dialog to render inline (no portals)
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, onKeyDown }: { children: React.ReactNode; onKeyDown?: (e: React.KeyboardEvent) => void }) => (
    <div data-testid="dialog-content" onKeyDown={onKeyDown}>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

// Mock Select to be a simple input
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

import { IssueCreateDialog } from "../issue-create-dialog";

beforeEach(() => {
  useUIStore.setState({
    createIssueDialogOpen: false,
    createIssueParentId: null,
  });
  useIssueStore.setState({ issues: [], loading: false });
  useLabelStore.setState({ labels: [], loading: false });
  useProjectStore.setState({ projects: [], loading: false });
  useUndoStore.setState({ stack: [] });
});

describe("IssueCreateDialog", () => {
  it("does not render when createIssueDialogOpen is false", async () => {
    await renderAsync(<IssueCreateDialog />);
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("opens when createIssueDialogOpen is true", async () => {
    useUIStore.setState({ createIssueDialogOpen: true });
    await renderAsync(<IssueCreateDialog />);
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByText("Create Issue")).toBeInTheDocument();
  });

  it("shows sub-issue indicator when createIssueParentId is set", async () => {
    useUIStore.setState({
      createIssueDialogOpen: true,
      createIssueParentId: "parent-1",
    });
    useIssueStore.setState({
      issues: [
        {
          id: "parent-1",
          number: 5,
          title: "Parent Issue",
          description: null,
          status: "todo",
          priority: "none",
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
    await renderAsync(<IssueCreateDialog />);
    expect(screen.getByText(/Sub-issue of CITY-5/)).toBeInTheDocument();
  });

  it("renders title input with correct placeholder", async () => {
    useUIStore.setState({ createIssueDialogOpen: true });
    await renderAsync(<IssueCreateDialog />);
    expect(screen.getByPlaceholderText("Issue title")).toBeInTheDocument();
  });

  it("has a Create Issue button that is disabled when title is empty", async () => {
    useUIStore.setState({ createIssueDialogOpen: true });
    await renderAsync(<IssueCreateDialog />);
    const btn = screen.getByRole("button", { name: "Create Issue" });
    expect(btn).toBeDisabled();
  });
});
