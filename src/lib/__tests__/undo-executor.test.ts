import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { executeUndo } from "../undo-executor";
import { useUndoStore, type UndoEntry } from "../stores/undo-store";
import { useIssueStore } from "../stores/issue-store";
import { useProjectStore } from "../stores/project-store";
import { useLabelStore } from "../stores/label-store";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  useUndoStore.setState({ stack: [] });
  useIssueStore.setState({ issues: [], loading: false });
  useProjectStore.setState({ projects: [], loading: false });
  useLabelStore.setState({ labels: [], loading: false });
});
afterAll(() => server.close());

const makeUndoEntry = (overrides: Partial<UndoEntry> = {}): UndoEntry => ({
  id: "undo_test_1",
  actionType: "delete",
  entityType: "issue",
  entityId: "issue-1",
  description: "City-1",
  previousState: { id: "issue-1", title: "Test Issue", number: 1 },
  timestamp: Date.now(),
  ...overrides,
});

describe("executeUndo", () => {
  it("undoDelete for issue: POST to /api/issues/restore, refetches store", async () => {
    const restoreHandler = vi.fn();
    server.use(
      http.post("/api/issues/restore", async ({ request }) => {
        restoreHandler(await request.json());
        return HttpResponse.json({ id: "issue-1", title: "Test Issue" }, { status: 201 });
      }),
      http.get("/api/issues", () => {
        return HttpResponse.json([{ id: "issue-1", title: "Test Issue", labels: [] }]);
      })
    );

    const entry = makeUndoEntry({ actionType: "delete", entityType: "issue" });
    const result = await executeUndo(entry);
    expect(result).toBe(true);
    expect(restoreHandler).toHaveBeenCalledOnce();
  });

  it("undoDelete for project: POST to /api/projects/restore", async () => {
    const restoreHandler = vi.fn();
    server.use(
      http.post("/api/projects/restore", async ({ request }) => {
        restoreHandler(await request.json());
        return HttpResponse.json({ id: "proj-1", name: "Test" }, { status: 201 });
      }),
      http.get("/api/projects", () => {
        return HttpResponse.json([]);
      })
    );

    const entry = makeUndoEntry({
      actionType: "delete",
      entityType: "project",
      entityId: "proj-1",
      previousState: { id: "proj-1", name: "Test" },
    });
    const result = await executeUndo(entry);
    expect(result).toBe(true);
    expect(restoreHandler).toHaveBeenCalledOnce();
  });

  it("undoDelete for label: POST to /api/labels/restore", async () => {
    server.use(
      http.post("/api/labels/restore", () => {
        return HttpResponse.json({ id: "label-1", name: "Bug" }, { status: 201 });
      }),
      http.get("/api/labels", () => {
        return HttpResponse.json([]);
      })
    );

    const entry = makeUndoEntry({
      actionType: "delete",
      entityType: "label",
      entityId: "label-1",
      previousState: { id: "label-1", name: "Bug" },
    });
    const result = await executeUndo(entry);
    expect(result).toBe(true);
  });

  it("undoUpdate for issue: PATCH with previousState, updates store", async () => {
    useIssueStore.setState({
      issues: [
        {
          id: "issue-1",
          number: 1,
          title: "New Title",
          description: null,
          status: "done",
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

    server.use(
      http.patch("/api/issues/issue-1", () => {
        return HttpResponse.json({
          id: "issue-1",
          number: 1,
          title: "Old Title",
          status: "todo",
          labels: [],
        });
      })
    );

    const entry = makeUndoEntry({
      actionType: "update",
      entityType: "issue",
      previousState: { title: "Old Title", status: "todo" },
    });
    const result = await executeUndo(entry);
    expect(result).toBe(true);
    const issue = useIssueStore.getState().issues.find((i) => i.id === "issue-1");
    expect(issue?.title).toBe("Old Title");
  });

  it("undoUpdate for project: PATCH with previousState", async () => {
    server.use(
      http.patch("/api/projects/proj-1", () => {
        return HttpResponse.json({ id: "proj-1", name: "Old Name" });
      }),
      http.get("/api/projects", () => {
        return HttpResponse.json([]);
      })
    );

    const entry = makeUndoEntry({
      actionType: "update",
      entityType: "project",
      entityId: "proj-1",
      previousState: { name: "Old Name" },
    });
    const result = await executeUndo(entry);
    expect(result).toBe(true);
  });

  it("undoCreate for issue: DELETE, removes from store", async () => {
    useIssueStore.setState({
      issues: [
        {
          id: "issue-1",
          number: 1,
          title: "Created Issue",
          description: null,
          status: "backlog",
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

    server.use(
      http.delete("/api/issues/issue-1", () => {
        return HttpResponse.json({ success: true });
      })
    );

    const entry = makeUndoEntry({
      actionType: "create",
      entityType: "issue",
    });
    const result = await executeUndo(entry);
    expect(result).toBe(true);
    expect(useIssueStore.getState().issues).toHaveLength(0);
  });

  it("executeUndo with no entry (empty stack) is a no-op", async () => {
    const result = await executeUndo();
    expect(result).toBe(false);
  });

  it("executeUndo with explicit entry uses provided entry, not stack", async () => {
    // Push a different entry to the stack
    useUndoStore.getState().pushUndo({
      actionType: "delete",
      entityType: "label",
      entityId: "label-other",
      description: "Stack entry",
      previousState: {},
    });

    server.use(
      http.delete("/api/issues/issue-explicit", () => {
        return HttpResponse.json({ success: true });
      })
    );

    const explicitEntry = makeUndoEntry({
      actionType: "create",
      entityType: "issue",
      entityId: "issue-explicit",
    });

    const result = await executeUndo(explicitEntry);
    expect(result).toBe(true);
    // Stack entry should have been removed because explicit entry was used
    // and the explicit entry gets removed from stack by id
  });
});
