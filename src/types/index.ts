import type { Issue, Project, Label, Comment, Attachment } from "@/lib/db/schema";

export type { Comment };

export type IssueWithLabels = Issue & {
  labels: Label[];
  project: Project | null;
  children: (Issue & { labels: Label[]; project: Project | null })[];
  parent: { id: string; number: number; title: string } | null;
  commentCount: number;
  attachments?: Attachment[];
};

export type ProjectWithCounts = Project & {
  issueCount: number;
  doneCount: number;
};

export type ViewMode = "list" | "board";

export type FtsSearchResult = {
  id: string;
  number: number;
  title: string;
  status: string;
  priority: string;
  titleSnippet: string;
  descriptionSnippet: string;
  rank: number;
};
