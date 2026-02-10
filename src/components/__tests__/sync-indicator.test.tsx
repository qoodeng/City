import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderAsync } from "@/test/render";
import { useSyncStore } from "@/lib/stores/sync-store";

// Mock lucide-react icons used by SyncIndicator
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual<typeof import("lucide-react")>("lucide-react");
  return {
    ...actual,
    Check: ({ className }: { className?: string }) => <span data-testid="check-icon" className={className}>check</span>,
    AlertCircle: ({ className }: { className?: string }) => <span data-testid="alert-icon" className={className}>alert</span>,
  };
});

// Mock crash-spinner
vi.mock("@/components/crash-spinner", () => ({
  CrashSpinner: ({ className }: { className?: string }) => <span data-testid="spinner" className={className}>spinning</span>,
}));

import { SyncIndicator } from "../sync-indicator";

beforeEach(() => {
  useSyncStore.setState({ pendingCount: 0, lastError: null });
});

describe("SyncIndicator", () => {
  it('shows "Saved" when pendingCount is 0', async () => {
    await renderAsync(<SyncIndicator />);
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it('shows "Syncing..." when pendingCount > 0', async () => {
    useSyncStore.setState({ pendingCount: 2 });
    await renderAsync(<SyncIndicator />);
    expect(screen.getByText("Syncing...")).toBeInTheDocument();
  });

  it("shows error state when lastError is set", async () => {
    useSyncStore.setState({ lastError: "Network error" });
    await renderAsync(<SyncIndicator />);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });
});
