import { test as base, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

interface Issue {
  id: string;
  number: number;
  title: string;
  status: string;
  priority: string;
  projectId: string | null;
  labels: Label[];
  [key: string]: unknown;
}

interface Project {
  id: string;
  name: string;
  color: string;
  issueCount: number;
  doneCount: number;
  [key: string]: unknown;
}

interface Label {
  id: string;
  name: string;
  color: string;
  [key: string]: unknown;
}

interface CommentData {
  id: string;
  issueId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiHelpers {
  createIssue(data?: Partial<{
    title: string;
    status: string;
    priority: string;
    projectId: string;
    labelIds: string[];
    parentId: string;
    dueDate: string;
    assignee: string;
    description: string;
  }>): Promise<Issue>;
  createProject(data?: Partial<{
    name: string;
    description: string;
    color: string;
  }>): Promise<Project>;
  createLabel(data?: Partial<{
    name: string;
    color: string;
    description: string;
  }>): Promise<Label>;
  createComment(issueId: string, content: string): Promise<CommentData>;
  deleteIssue(id: string): Promise<void>;
  deleteProject(id: string): Promise<void>;
  deleteLabel(id: string): Promise<void>;
  updateIssue(id: string, data: Record<string, unknown>): Promise<Issue>;
  updateProject(id: string, data: Record<string, unknown>): Promise<Project>;
}

export const test = base.extend<{ api: ApiHelpers }>({
  api: async ({}, use) => {
    const createdIssueIds: string[] = [];
    const createdProjectIds: string[] = [];
    const createdLabelIds: string[] = [];
    const suffix = Date.now();

    const api: ApiHelpers = {
      async createIssue(data = {}) {
        const res = await fetch(`${BASE_URL}/api/issues`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title ?? `Test Issue ${suffix}-${createdIssueIds.length}`,
            status: data.status ?? "backlog",
            priority: data.priority ?? "none",
            ...data,
          }),
        });
        if (!res.ok) throw new Error(`Failed to create issue: ${res.status}`);
        const issue = await res.json();
        createdIssueIds.push(issue.id);
        return issue;
      },

      async createProject(data = {}) {
        const res = await fetch(`${BASE_URL}/api/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name ?? `Test Project ${suffix}-${createdProjectIds.length}`,
            color: data.color ?? "#FFD700",
            ...data,
          }),
        });
        if (!res.ok) throw new Error(`Failed to create project: ${res.status}`);
        const project = await res.json();
        createdProjectIds.push(project.id);
        return project;
      },

      async createLabel(data = {}) {
        const res = await fetch(`${BASE_URL}/api/labels`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name ?? `Test Label ${suffix}-${createdLabelIds.length}`,
            color: data.color ?? "#3B82F6",
            ...data,
          }),
        });
        if (!res.ok) throw new Error(`Failed to create label: ${res.status}`);
        const label = await res.json();
        createdLabelIds.push(label.id);
        return label;
      },

      async createComment(issueId: string, content: string) {
        const res = await fetch(`${BASE_URL}/api/issues/${issueId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error(`Failed to create comment: ${res.status}`);
        return res.json();
      },

      async deleteIssue(id: string) {
        await fetch(`${BASE_URL}/api/issues/${id}`, { method: "DELETE" });
      },

      async deleteProject(id: string) {
        await fetch(`${BASE_URL}/api/projects/${id}`, { method: "DELETE" });
      },

      async deleteLabel(id: string) {
        await fetch(`${BASE_URL}/api/labels/${id}`, { method: "DELETE" });
      },

      async updateIssue(id: string, data: Record<string, unknown>) {
        const res = await fetch(`${BASE_URL}/api/issues/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Failed to update issue: ${res.status}`);
        return res.json();
      },

      async updateProject(id: string, data: Record<string, unknown>) {
        const res = await fetch(`${BASE_URL}/api/projects/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Failed to update project: ${res.status}`);
        return res.json();
      },
    };

    await use(api);

    // Cleanup: delete all created entities in reverse order
    for (const id of createdIssueIds.reverse()) {
      await fetch(`${BASE_URL}/api/issues/${id}`, { method: "DELETE" }).catch(() => {});
    }
    for (const id of createdProjectIds.reverse()) {
      await fetch(`${BASE_URL}/api/projects/${id}`, { method: "DELETE" }).catch(() => {});
    }
    for (const id of createdLabelIds.reverse()) {
      await fetch(`${BASE_URL}/api/labels/${id}`, { method: "DELETE" }).catch(() => {});
    }
  },
});

export { expect };
