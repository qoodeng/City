import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { useIssueStore } from "../issue-store";
import { useUndoStore } from "../undo-store";
import { useSyncStore } from "../sync-store";
import type { IssueWithLabels } from "@/types";

const mockIssue: IssueWithLabels = {
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
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  labels: [],
  project: null,
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  useIssueStore.setState({ issues: [], loading: false });
  useUndoStore.setState({ stack: [] });
  useSyncStore.setState({ pendingCount: 0, lastError: null });
});
afterAll(() => server.close());

describe("useIssueStore", () => {
  it("fetchIssues populates store from API", async () => {
    server.use(
      http.get("/api/issues", () => HttpResponse.json([mockIssue]))
    );

    await useIssueStore.getState().fetchIssues();
    expect(useIssueStore.getState().issues).toHaveLength(1);
    expect(useIssueStore.getState().issues[0].title).toBe("Test Issue");
  });

  it("createIssue adds to store immediately (from response)", async () => {
    const created: IssueWithLabels = { ...mockIssue, id: "new-1", number: 5, title: "Created" };
    server.use(
      http.post("/api/issues", () => HttpResponse.json(created, { status: 201 }))
    );

    const result = await useIssueStore.getState().createIssue({ title: "Created" });
    expect(result).not.toBeNull();
    expect(useIssueStore.getState().issues).toHaveLength(1);
    expect(useIssueStore.getState().issues[0].title).toBe("Created");
  });

  it("createIssue updates with server response (real number/ID)", async () => {
    const serverIssue: IssueWithLabels = { ...mockIssue, id: "server-id", number: 42, title: "Server Title" };
    server.use(
      http.post("/api/issues", () => HttpResponse.json(serverIssue, { status: 201 }))
    );

    const result = await useIssueStore.getState().createIssue({ title: "Client Title" });
    expect(result?.id).toBe("server-id");
    expect(result?.number).toBe(42);
  });

  it("updateIssue applies change optimistically", async () => {
    useIssueStore.setState({ issues: [mockIssue] });

    server.use(
      http.patch("/api/issues/issue-1", () =>
        HttpResponse.json({ ...mockIssue, status: "done" })
      )
    );

    // The store applies the update optimistically before the response
    const promise = useIssueStore.getState().updateIssue("issue-1", { status: "done" });
    // Immediately after calling, the state should be updated optimistically
    expect(useIssueStore.getState().issues[0].status).toBe("done");
    await promise;
  });

  it("updateIssue reverts on API failure (rollback)", async () => {
    useIssueStore.setState({ issues: [mockIssue] });

    server.use(
      http.patch("/api/issues/issue-1", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 })
      )
    );

    const result = await useIssueStore.getState().updateIssue("issue-1", { status: "done" });
    expect(result).toBe(false);
    // Should have reverted
    expect(useIssueStore.getState().issues[0].status).toBe("todo");
  });

  it("updateIssue pushes undo entry with previous state", async () => {
    useIssueStore.setState({ issues: [mockIssue] });

    server.use(
      http.patch("/api/issues/issue-1", () =>
        HttpResponse.json({ ...mockIssue, status: "done" })
      )
    );

    await useIssueStore.getState().updateIssue("issue-1", { status: "done" });
    const undoEntry = useUndoStore.getState().stack[0];
    expect(undoEntry).toBeDefined();
    expect(undoEntry.actionType).toBe("update");
    expect(undoEntry.previousState.status).toBe("todo");
  });

  it("deleteIssue removes optimistically", async () => {
    useIssueStore.setState({ issues: [mockIssue] });

    server.use(
      http.delete("/api/issues/issue-1", () => HttpResponse.json({ success: true }))
    );

    const promise = useIssueStore.getState().deleteIssue("issue-1");
    // Immediately removed
    expect(useIssueStore.getState().issues).toHaveLength(0);
    await promise;
  });

  it("deleteIssue reverts on API failure", async () => {
    useIssueStore.setState({ issues: [mockIssue] });

    server.use(
      http.delete("/api/issues/issue-1", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 })
      )
    );

    const result = await useIssueStore.getState().deleteIssue("issue-1");
    expect(result).toBe(false);
    expect(useIssueStore.getState().issues).toHaveLength(1);
  });

  it("deleteIssue pushes undo entry with full snapshot", async () => {
    useIssueStore.setState({ issues: [mockIssue] });

    server.use(
      http.delete("/api/issues/issue-1", () => HttpResponse.json({ success: true }))
    );

    await useIssueStore.getState().deleteIssue("issue-1");
    const undoEntry = useUndoStore.getState().stack[0];
    expect(undoEntry).toBeDefined();
    expect(undoEntry.actionType).toBe("delete");
    expect(undoEntry.entityType).toBe("issue");
    expect(undoEntry.previousState.title).toBe("Test Issue");
  });

  it("sync counter increments/decrements around mutations", async () => {
    useIssueStore.setState({ issues: [mockIssue] });

    let resolveHandler: () => void;
    const handlerPromise = new Promise<void>((r) => { resolveHandler = r; });

    server.use(
      http.patch("/api/issues/issue-1", async () => {
        // At this point, sync counter should be incremented
        expect(useSyncStore.getState().pendingCount).toBe(1);
        resolveHandler();
        return HttpResponse.json({ ...mockIssue, status: "done" });
      })
    );

    const updatePromise = useIssueStore.getState().updateIssue("issue-1", { status: "done" });
    await handlerPromise;
    await updatePromise;
    // After completion, counter should be back to 0
    expect(useSyncStore.getState().pendingCount).toBe(0);
  });
});
