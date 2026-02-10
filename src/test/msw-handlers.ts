import { http, HttpResponse } from "msw";
import type { IssueWithLabels } from "@/types";
import type { Label } from "@/lib/db/schema";
import type { ProjectWithCounts } from "@/types";

// Default mock data
export const mockIssues: IssueWithLabels[] = [
  {
    id: "issue-1",
    number: 1,
    title: "First Issue",
    description: "Description 1",
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
    children: [],
    parent: null,
    commentCount: 0,
  },
  {
    id: "issue-2",
    number: 2,
    title: "Second Issue",
    description: "Description 2",
    status: "in_progress",
    priority: "medium",
    assignee: null,
    projectId: null,
    parentId: null,
    dueDate: null,
    sortOrder: 0,
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
    labels: [],
    project: null,
    children: [],
    parent: null,
    commentCount: 0,
  },
];

export const mockLabels: Label[] = [
  {
    id: "label-1",
    name: "Bug",
    color: "#EF4444",
    description: "Something broken",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "label-2",
    name: "Feature",
    color: "#3B82F6",
    description: "New feature",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
];

export const mockProjects: ProjectWithCounts[] = [
  {
    id: "project-1",
    name: "Test Project",
    description: "A test project",
    status: "active",
    color: "#FFD700",
    icon: "folder",
    sortOrder: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    issueCount: 0,
    doneCount: 0,
  },
];

export const handlers = [
  // Issues
  http.get("/api/issues", () => {
    return HttpResponse.json(mockIssues);
  }),

  http.post("/api/issues", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newIssue: IssueWithLabels = {
      id: "issue-new",
      number: 3,
      title: body.title as string,
      description: (body.description as string) || null,
      status: (body.status as string) || "backlog",
      priority: (body.priority as string) || "none",
      assignee: null,
      projectId: null,
      parentId: null,
      dueDate: null,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      labels: [],
      project: null,
      children: [],
      parent: null,
      commentCount: 0,
    };
    return HttpResponse.json(newIssue, { status: 201 });
  }),

  http.patch("/api/issues/:id", async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const issue = mockIssues.find((i) => i.id === params.id);
    if (!issue) return HttpResponse.json({ error: "Not found" }, { status: 404 });
    return HttpResponse.json({ ...issue, ...body });
  }),

  http.delete("/api/issues/:id", ({ params }) => {
    const issue = mockIssues.find((i) => i.id === params.id);
    if (!issue) return HttpResponse.json({ error: "Not found" }, { status: 404 });
    return HttpResponse.json({ success: true });
  }),

  http.post("/api/issues/restore", () => {
    return HttpResponse.json(mockIssues[0], { status: 201 });
  }),

  // Labels
  http.get("/api/labels", () => {
    return HttpResponse.json(mockLabels);
  }),

  http.post("/api/labels", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: "label-new",
        name: body.name,
        color: body.color || "#6B7280",
        description: body.description || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.patch("/api/labels/:id", async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const label = mockLabels.find((l) => l.id === params.id);
    if (!label) return HttpResponse.json({ error: "Not found" }, { status: 404 });
    return HttpResponse.json({ ...label, ...body });
  }),

  http.delete("/api/labels/:id", ({ params }) => {
    const label = mockLabels.find((l) => l.id === params.id);
    if (!label) return HttpResponse.json({ error: "Not found" }, { status: 404 });
    return HttpResponse.json({ success: true });
  }),

  http.post("/api/labels/restore", () => {
    return HttpResponse.json(mockLabels[0], { status: 201 });
  }),

  // Projects
  http.get("/api/projects", () => {
    return HttpResponse.json(mockProjects);
  }),

  http.post("/api/projects", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: "project-new",
        name: body.name,
        description: body.description || null,
        status: "active",
        color: body.color || "#FFD700",
        icon: body.icon || "folder",
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        issueCount: 0,
        doneCount: 0,
      },
      { status: 201 }
    );
  }),

  http.patch("/api/projects/:id", async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const project = mockProjects.find((p) => p.id === params.id);
    if (!project) return HttpResponse.json({ error: "Not found" }, { status: 404 });
    return HttpResponse.json({ ...project, ...body });
  }),

  http.delete("/api/projects/:id", ({ params }) => {
    const project = mockProjects.find((p) => p.id === params.id);
    if (!project) return HttpResponse.json({ error: "Not found" }, { status: 404 });
    return HttpResponse.json({ success: true });
  }),

  http.post("/api/projects/restore", () => {
    return HttpResponse.json({ ...mockProjects[0] }, { status: 201 });
  }),

  // Search
  http.get("/api/issues/search", ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    if (!q) return HttpResponse.json([]);
    return HttpResponse.json([
      {
        id: "issue-1",
        number: 1,
        title: "First Issue",
        status: "todo",
        priority: "high",
        titleSnippet: `<mark>${q}</mark> in First Issue`,
        descriptionSnippet: "",
        rank: -1,
      },
    ]);
  }),
];
