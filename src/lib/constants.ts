export const STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "done",
  "cancelled",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; icon: string }
> = {
  backlog: { label: "Backlog", color: "#6B7280", icon: "circle-dashed" },
  todo: { label: "Todo", color: "#A1A1AA", icon: "circle" },
  in_progress: {
    label: "In Progress",
    color: "#FFD700",
    icon: "circle-half",
  },
  done: { label: "Done", color: "#22C55E", icon: "circle-check" },
  cancelled: { label: "Cancelled", color: "#EF4444", icon: "circle-x" },
};

export const PRIORITIES = [
  "urgent",
  "high",
  "medium",
  "low",
  "none",
] as const;

export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; icon: string; order: number }
> = {
  urgent: {
    label: "Urgent",
    color: "#EF4444",
    icon: "alert-triangle",
    order: 0,
  },
  high: { label: "High", color: "#F97316", icon: "arrow-up", order: 1 },
  medium: { label: "Medium", color: "#FFD700", icon: "minus", order: 2 },
  low: { label: "Low", color: "#6B7280", icon: "arrow-down", order: 3 },
  none: {
    label: "No Priority",
    color: "#4B5563",
    icon: "more-horizontal",
    order: 4,
  },
};

export const DEFAULT_LABELS = [
  { name: "Bug", color: "#EF4444", description: "Something isn't working" },
  { name: "Feature", color: "#3B82F6", description: "New functionality" },
  {
    name: "Improvement",
    color: "#8B5CF6",
    description: "Enhancement to existing feature",
  },
  {
    name: "Documentation",
    color: "#6B7280",
    description: "Documentation changes",
  },
  { name: "Design", color: "#EC4899", description: "Design related" },
  {
    name: "Performance",
    color: "#F59E0B",
    description: "Performance improvements",
  },
] as const;

export const PROJECT_STATUSES = [
  "active",
  "paused",
  "completed",
  "archived",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_COLORS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#22C55E",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#FFD700",
  "#14B8A6",
] as const;