import { z } from "zod";

/** Reusable enum schemas matching the constants */
const statusEnum = z.enum(["backlog", "todo", "in_progress", "done", "cancelled"]);
const priorityEnum = z.enum(["none", "low", "medium", "high", "urgent"]);
const projectStatusEnum = z.enum(["active", "paused", "completed", "archived"]);
const hexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
const projectIconEnum = z.enum([
  "folder", "rocket", "zap", "target", "box",
  "layers", "globe", "shield", "heart", "star",
]);

// ── Issues ──────────────────────────────────────────────

export const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(100_000).optional().nullable(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  assignee: z.string().max(200).optional().nullable(),
  projectId: z.string().max(50).optional().nullable(),
  parentId: z.string().max(50).optional().nullable(),
  dueDate: z.string().max(50).optional().nullable(),
  labelIds: z.array(z.string().max(50)).max(50).optional(),
});

export const updateIssueSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(100_000).optional().nullable(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  assignee: z.string().max(200).optional().nullable(),
  projectId: z.string().max(50).optional().nullable(),
  parentId: z.string().max(50).optional().nullable(),
  dueDate: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().finite().optional(),
  labelIds: z.array(z.string().max(50)).max(50).optional(),
});

export const batchUpdateSchema = z.object({
  issueIds: z.array(z.string().max(50)).min(1, "No issue IDs provided").max(500),
  updates: z.object({
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    assignee: z.string().max(200).optional().nullable(),
    projectId: z.string().max(50).optional().nullable(),
  }),
});

export const batchDeleteSchema = z.object({
  issueIds: z.array(z.string().max(50)).min(1, "No issue IDs provided").max(500),
});

export const restoreIssueSchema = z.object({
  id: z.string().min(1).max(50),
  number: z.number().int().nonnegative(),
  title: z.string().min(1).max(500),
  description: z.string().max(100_000).optional().nullable(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  assignee: z.string().max(200).optional().nullable(),
  projectId: z.string().max(50).optional().nullable(),
  parentId: z.string().max(50).optional().nullable(),
  dueDate: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().finite().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  labels: z.array(z.union([
    z.string(),
    z.object({ id: z.string() }).passthrough(),
  ])).optional(),
});

// ── Comments ────────────────────────────────────────────

export const createCommentSchema = z.object({
  content: z.string().min(1, "Content is required").max(100_000),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Content is required").max(100_000),
});

// ── Labels ──────────────────────────────────────────────

export const createLabelSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  color: hexColor.optional(),
  description: z.string().max(500).optional().nullable(),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: hexColor.optional(),
  description: z.string().max(500).optional().nullable(),
});

export const restoreLabelSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  color: hexColor.optional(),
  description: z.string().max(500).optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// ── Projects ────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  color: hexColor.optional(),
  icon: projectIconEnum.optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: projectStatusEnum.optional(),
  color: hexColor.optional(),
  icon: projectIconEnum.optional(),
  sortOrder: z.number().int().finite().optional(),
});

export const restoreProjectSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  status: projectStatusEnum.optional(),
  color: hexColor.optional(),
  icon: projectIconEnum.optional(),
  sortOrder: z.number().int().finite().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
