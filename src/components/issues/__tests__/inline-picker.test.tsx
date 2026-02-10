import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderAsync } from "@/test/render";
import { useUIStore } from "@/lib/stores/ui-store";
import { useIssueStore } from "@/lib/stores/issue-store";
import { useLabelStore } from "@/lib/stores/label-store";
import { useProjectStore } from "@/lib/stores/project-store";

// Mock cmdk Command components
vi.mock("@/components/ui/command", () => ({
  Command: ({ children }: { children: React.ReactNode }) => <div data-testid="command">{children}</div>,
  CommandInput: ({ placeholder }: { placeholder?: string }) => (
    <input placeholder={placeholder} data-testid="command-input" />
  ),
  CommandList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandItem: ({ children, onSelect, value }: { children: React.ReactNode; onSelect?: () => void; value?: string }) => (
    <button onClick={onSelect} data-value={value}>{children}</button>
  ),
  CommandEmpty: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { InlinePicker } from "../inline-picker";

const mockIssue = {
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
};

beforeEach(() => {
  useUIStore.setState({ inlinePicker: null, focusedIssueId: null });
  useIssueStore.setState({ issues: [mockIssue], loading: false });
  useLabelStore.setState({ labels: [], loading: false });
  useProjectStore.setState({ projects: [], loading: false });
  // Mock querySelector for positioning
  document.querySelector = vi.fn().mockReturnValue({
    getBoundingClientRect: () => ({ bottom: 100, left: 100, right: 200, top: 80 }),
  });
});

describe("InlinePicker", () => {
  it("returns null when inlinePicker is null", async () => {
    const { container } = await renderAsync(<InlinePicker />);
    expect(container.innerHTML).toBe("");
  });

  it("renders status options when type is status", async () => {
    useUIStore.setState({ inlinePicker: { type: "status", issueId: "issue-1" } });
    await renderAsync(<InlinePicker />);
    expect(screen.getByText("Backlog")).toBeInTheDocument();
    expect(screen.getByText("Todo")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("renders priority options when type is priority", async () => {
    useUIStore.setState({ inlinePicker: { type: "priority", issueId: "issue-1" } });
    await renderAsync(<InlinePicker />);
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("No Priority")).toBeInTheDocument();
  });

  it("renders placeholder for status picker", async () => {
    useUIStore.setState({ inlinePicker: { type: "status", issueId: "issue-1" } });
    await renderAsync(<InlinePicker />);
    expect(screen.getByPlaceholderText("Set status...")).toBeInTheDocument();
  });

  it("renders placeholder for priority picker", async () => {
    useUIStore.setState({ inlinePicker: { type: "priority", issueId: "issue-1" } });
    await renderAsync(<InlinePicker />);
    expect(screen.getByPlaceholderText("Set priority...")).toBeInTheDocument();
  });
});
