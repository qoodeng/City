import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { useCommentStore } from "../comment-store";
import { useUndoStore } from "../undo-store";
import { useSyncStore } from "../sync-store";
import type { Comment } from "@/types";

const mockComment: Comment = {
  id: "comment-1",
  issueId: "issue-1",
  content: "Test Comment",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  useCommentStore.setState({ comments: [], issueId: null, loading: false });
  useUndoStore.setState({ stack: [] });
  useSyncStore.setState({ pendingCount: 0, lastError: null });
});
afterAll(() => server.close());

describe("useCommentStore", () => {
  it("fetchComments populates store from API", async () => {
    server.use(
      http.get("/api/issues/issue-1/comments", () => HttpResponse.json([mockComment]))
    );

    await useCommentStore.getState().fetchComments("issue-1");
    expect(useCommentStore.getState().comments).toHaveLength(1);
    expect(useCommentStore.getState().comments[0].content).toBe("Test Comment");
    expect(useCommentStore.getState().issueId).toBe("issue-1");
  });

  it("createComment adds to store immediately (from response)", async () => {
    const created: Comment = { ...mockComment, id: "new-1", content: "Created Comment" };
    server.use(
      http.post("/api/issues/issue-1/comments", () => HttpResponse.json(created, { status: 201 }))
    );

    const result = await useCommentStore.getState().createComment("issue-1", "Created Comment");
    expect(result).not.toBeNull();
    expect(useCommentStore.getState().comments).toHaveLength(1);
    expect(useCommentStore.getState().comments[0].content).toBe("Created Comment");
  });

  it("createComment pushes undo entry", async () => {
    const created: Comment = { ...mockComment, id: "new-1", content: "Created Comment" };
    server.use(
      http.post("/api/issues/issue-1/comments", () => HttpResponse.json(created, { status: 201 }))
    );

    await useCommentStore.getState().createComment("issue-1", "Created Comment");
    const undoEntry = useUndoStore.getState().stack[0];
    expect(undoEntry).toBeDefined();
    expect(undoEntry.actionType).toBe("create");
    expect(undoEntry.entityType).toBe("comment");
    expect(undoEntry.entityId).toBe("new-1");
  });

  it("updateComment applies change optimistically", async () => {
    useCommentStore.setState({ comments: [mockComment], issueId: "issue-1" });

    server.use(
      http.patch("/api/issues/issue-1/comments/comment-1", () =>
        HttpResponse.json({ ...mockComment, content: "Updated Content" })
      )
    );

    // The store applies the update optimistically before the response
    const promise = useCommentStore.getState().updateComment("issue-1", "comment-1", "Updated Content");
    // Immediately after calling, the state should be updated optimistically
    expect(useCommentStore.getState().comments[0].content).toBe("Updated Content");
    await promise;
  });

  it("updateComment reverts on API failure (rollback)", async () => {
    useCommentStore.setState({ comments: [mockComment], issueId: "issue-1" });

    server.use(
      http.patch("/api/issues/issue-1/comments/comment-1", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 })
      )
    );

    const result = await useCommentStore.getState().updateComment("issue-1", "comment-1", "Updated Content");
    expect(result).toBe(false);
    // Should have reverted
    expect(useCommentStore.getState().comments[0].content).toBe("Test Comment");
  });

  it("updateComment pushes undo entry with previous state", async () => {
    useCommentStore.setState({ comments: [mockComment], issueId: "issue-1" });

    server.use(
      http.patch("/api/issues/issue-1/comments/comment-1", () =>
        HttpResponse.json({ ...mockComment, content: "Updated Content" })
      )
    );

    await useCommentStore.getState().updateComment("issue-1", "comment-1", "Updated Content");
    const undoEntry = useUndoStore.getState().stack[0];
    expect(undoEntry).toBeDefined();
    expect(undoEntry.actionType).toBe("update");
    expect(undoEntry.entityType).toBe("comment");
    expect(undoEntry.previousState.content).toBe("Test Comment");
  });

  it("deleteComment removes optimistically", async () => {
    useCommentStore.setState({ comments: [mockComment], issueId: "issue-1" });

    server.use(
      http.delete("/api/issues/issue-1/comments/comment-1", () => HttpResponse.json({ success: true }))
    );

    const promise = useCommentStore.getState().deleteComment("issue-1", "comment-1");
    // Immediately removed
    expect(useCommentStore.getState().comments).toHaveLength(0);
    await promise;
  });

  it("deleteComment reverts on API failure", async () => {
    useCommentStore.setState({ comments: [mockComment], issueId: "issue-1" });

    server.use(
      http.delete("/api/issues/issue-1/comments/comment-1", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 })
      )
    );

    const result = await useCommentStore.getState().deleteComment("issue-1", "comment-1");
    expect(result).toBe(false);
    expect(useCommentStore.getState().comments).toHaveLength(1);
  });

  it("deleteComment pushes undo entry with full snapshot", async () => {
    useCommentStore.setState({ comments: [mockComment], issueId: "issue-1" });

    server.use(
      http.delete("/api/issues/issue-1/comments/comment-1", () => HttpResponse.json({ success: true }))
    );

    await useCommentStore.getState().deleteComment("issue-1", "comment-1");
    const undoEntry = useUndoStore.getState().stack[0];
    expect(undoEntry).toBeDefined();
    expect(undoEntry.actionType).toBe("delete");
    expect(undoEntry.entityType).toBe("comment");
    expect(undoEntry.previousState.content).toBe("Test Comment");
  });

  it("sync counter increments/decrements around mutations", async () => {
    useCommentStore.setState({ comments: [mockComment], issueId: "issue-1" });

    let resolveHandler: () => void;
    const handlerPromise = new Promise<void>((r) => { resolveHandler = r; });

    server.use(
      http.patch("/api/issues/issue-1/comments/comment-1", async () => {
        // At this point, sync counter should be incremented
        expect(useSyncStore.getState().pendingCount).toBe(1);
        resolveHandler();
        return HttpResponse.json({ ...mockComment, content: "Updated Content" });
      })
    );

    const updatePromise = useCommentStore.getState().updateComment("issue-1", "comment-1", "Updated Content");
    await handlerPromise;
    await updatePromise;
    // After completion, counter should be back to 0
    expect(useSyncStore.getState().pendingCount).toBe(0);
  });
});
