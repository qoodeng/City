import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { useProjectStore } from "../project-store";
import { useUndoStore } from "../undo-store";
import { useSyncStore } from "../sync-store";
import type { ProjectWithCounts } from "@/types";

const mockProject: ProjectWithCounts = {
  id: "project-1",
  name: "Test Project",
  description: null,
  status: "active",
  color: "#FFD700",
  icon: "folder",
  sortOrder: 0,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  issueCount: 0,
  doneCount: 0,
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  useProjectStore.setState({ projects: [], loading: false });
  useUndoStore.setState({ stack: [] });
  useSyncStore.setState({ pendingCount: 0, lastError: null });
});
afterAll(() => server.close());

describe("useProjectStore", () => {
  it("fetchProjects populates store", async () => {
    server.use(
      http.get("/api/projects", () => HttpResponse.json([mockProject]))
    );

    await useProjectStore.getState().fetchProjects();
    expect(useProjectStore.getState().projects).toHaveLength(1);
    expect(useProjectStore.getState().projects[0].name).toBe("Test Project");
  });

  it("createProject adds optimistically", async () => {
    const created: ProjectWithCounts = { ...mockProject, id: "new-p", name: "New" };
    server.use(
      http.post("/api/projects", () => HttpResponse.json(created, { status: 201 }))
    );

    const result = await useProjectStore.getState().createProject({ name: "New" });
    expect(result).not.toBeNull();
    expect(useProjectStore.getState().projects).toHaveLength(1);
  });

  it("updateProject updates optimistically, reverts on failure", async () => {
    useProjectStore.setState({ projects: [mockProject] });

    server.use(
      http.patch("/api/projects/project-1", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 })
      )
    );

    const result = await useProjectStore.getState().updateProject("project-1", { name: "Updated" });
    expect(result).toBe(false);
    // Should revert
    expect(useProjectStore.getState().projects[0].name).toBe("Test Project");
  });

  it("deleteProject removes optimistically, reverts on failure", async () => {
    useProjectStore.setState({ projects: [mockProject] });

    server.use(
      http.delete("/api/projects/project-1", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 })
      )
    );

    const result = await useProjectStore.getState().deleteProject("project-1");
    expect(result).toBe(false);
    expect(useProjectStore.getState().projects).toHaveLength(1);
  });

  it("all mutations push undo entries", async () => {
    useProjectStore.setState({ projects: [mockProject] });

    server.use(
      http.patch("/api/projects/project-1", () =>
        HttpResponse.json({ ...mockProject, name: "Updated" })
      ),
      http.delete("/api/projects/project-1", () =>
        HttpResponse.json({ success: true })
      )
    );

    await useProjectStore.getState().updateProject("project-1", { name: "Updated" });
    expect(useUndoStore.getState().stack).toHaveLength(1);

    useProjectStore.setState({ projects: [mockProject] });
    await useProjectStore.getState().deleteProject("project-1");
    expect(useUndoStore.getState().stack).toHaveLength(2);
  });

  it("all mutations update sync counter", async () => {
    const created: ProjectWithCounts = { ...mockProject, id: "new-p" };
    server.use(
      http.post("/api/projects", () => HttpResponse.json(created, { status: 201 }))
    );

    await useProjectStore.getState().createProject({ name: "New" });
    // After completion, counter should be back to 0
    expect(useSyncStore.getState().pendingCount).toBe(0);
  });
});
