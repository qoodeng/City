import { describe, it, expect, vi } from "vitest";
import { screen, act } from "@testing-library/react";
import { renderAsync } from "@/test/render";

// Mock Dialog to render inline
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="keyboard-dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

import { KeyboardHelp } from "../keyboard-help";

describe("KeyboardHelp", () => {
  it("renders all shortcut categories when opened via custom event", async () => {
    await renderAsync(<KeyboardHelp />);
    // Initially closed
    expect(screen.queryByTestId("keyboard-dialog")).not.toBeInTheDocument();

    // Fire custom event to open
    await act(async () => {
      window.dispatchEvent(new Event("city:keyboard-help"));
    });

    expect(screen.getByTestId("keyboard-dialog")).toBeInTheDocument();
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    expect(screen.getByText("Global")).toBeInTheDocument();
    expect(screen.getByText("Navigation")).toBeInTheDocument();
    expect(screen.getByText("Issue Actions")).toBeInTheDocument();
    expect(screen.getByText("Pickers")).toBeInTheDocument();
  });

  it("renders individual keyboard shortcuts", async () => {
    await renderAsync(<KeyboardHelp />);
    await act(async () => {
      window.dispatchEvent(new Event("city:keyboard-help"));
    });

    expect(screen.getByText("Command palette")).toBeInTheDocument();
    expect(screen.getByText("Create issue")).toBeInTheDocument();
    expect(screen.getByText("Move down")).toBeInTheDocument();
    expect(screen.getByText("Mark done")).toBeInTheDocument();
    expect(screen.getByText("Status picker")).toBeInTheDocument();
  });
});
