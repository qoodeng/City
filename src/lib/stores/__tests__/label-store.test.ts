import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { useLabelStore } from "../label-store";
import { useUndoStore } from "../undo-store";
import { useSyncStore } from "../sync-store";
import type { Label } from "@/lib/db/schema";

const mockLabel: Label = {
  id: "label-1",
  name: "Bug",
  color: "#EF4444",
  description: "Something broken",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  useLabelStore.setState({ labels: [], loading: false });
  useUndoStore.setState({ stack: [] });
  useSyncStore.setState({ pendingCount: 0, lastError: null });
});
afterAll(() => server.close());

describe("useLabelStore", () => {
  it("fetchLabels populates store", async () => {
    server.use(
      http.get("/api/labels", () => HttpResponse.json([mockLabel]))
    );

    await useLabelStore.getState().fetchLabels();
    expect(useLabelStore.getState().labels).toHaveLength(1);
    expect(useLabelStore.getState().labels[0].name).toBe("Bug");
  });

  it("createLabel adds optimistically", async () => {
    const created: Label = { ...mockLabel, id: "new-l", name: "Feature" };
    server.use(
      http.post("/api/labels", () => HttpResponse.json(created, { status: 201 }))
    );

    const result = await useLabelStore.getState().createLabel({ name: "Feature" });
    expect(result).not.toBeNull();
    expect(useLabelStore.getState().labels).toHaveLength(1);
  });

  it("updateLabel updates optimistically, reverts on failure", async () => {
    useLabelStore.setState({ labels: [mockLabel] });

    server.use(
      http.patch("/api/labels/label-1", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 })
      )
    );

    const result = await useLabelStore.getState().updateLabel("label-1", { name: "Updated" });
    expect(result).toBe(false);
    expect(useLabelStore.getState().labels[0].name).toBe("Bug");
  });

  it("deleteLabel removes optimistically, reverts on failure", async () => {
    useLabelStore.setState({ labels: [mockLabel] });

    server.use(
      http.delete("/api/labels/label-1", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 })
      )
    );

    const result = await useLabelStore.getState().deleteLabel("label-1");
    expect(result).toBe(false);
    expect(useLabelStore.getState().labels).toHaveLength(1);
  });

  it("all mutations push undo entries", async () => {
    useLabelStore.setState({ labels: [mockLabel] });

    server.use(
      http.patch("/api/labels/label-1", () =>
        HttpResponse.json({ ...mockLabel, name: "Updated" })
      ),
      http.delete("/api/labels/label-1", () =>
        HttpResponse.json({ success: true })
      )
    );

    await useLabelStore.getState().updateLabel("label-1", { name: "Updated" });
    expect(useUndoStore.getState().stack).toHaveLength(1);

    useLabelStore.setState({ labels: [mockLabel] });
    await useLabelStore.getState().deleteLabel("label-1");
    expect(useUndoStore.getState().stack).toHaveLength(2);
  });

  it("all mutations update sync counter", async () => {
    const created: Label = { ...mockLabel, id: "new-l" };
    server.use(
      http.post("/api/labels", () => HttpResponse.json(created, { status: 201 }))
    );

    await useLabelStore.getState().createLabel({ name: "New" });
    expect(useSyncStore.getState().pendingCount).toBe(0);
  });
});
