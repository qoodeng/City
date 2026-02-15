"use client";

import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import {
  StatusPicker,
  PriorityPicker,
  LabelPicker,
  ProjectPicker,
  AssigneeInput,
} from "@/components/issues/issue-properties";
import { ParentIssuePicker } from "@/components/issues/parent-issue-picker";
import { LabelBadge } from "@/components/label-badge";
import type { IssueWithLabels } from "@/types";
import type { Status, Priority } from "@/lib/constants";
import type { Label, Project } from "@/lib/db/schema";

interface IssueSidebarProps {
  issue: IssueWithLabels;
  labels: Label[];
  projects: Project[];
  onUpdate: (data: Record<string, unknown>) => Promise<void>;
  onLabelChange: (labelIds: string[]) => Promise<void>;
}

export function IssueSidebar({
  issue,
  labels,
  projects,
  onUpdate,
  onLabelChange,
}: IssueSidebarProps) {
  return (
    <div className="w-64 border-l border-border p-4 space-y-4 overflow-auto shrink-0">
      <div>
        <div className="text-xs font-medium text-muted-foreground mb-1">
          Status
        </div>
        <StatusPicker
          value={issue.status as Status}
          onChange={(status) => onUpdate({ status })}
        />
      </div>

      <div>
        <div className="text-xs font-medium text-muted-foreground mb-1">
          Priority
        </div>
        <PriorityPicker
          value={issue.priority as Priority}
          onChange={(priority) => onUpdate({ priority })}
        />
      </div>

      <div>
        <div className="text-xs font-medium text-muted-foreground mb-1">
          Assignee
        </div>
        <AssigneeInput
          value={issue.assignee}
          onChange={(assignee) => onUpdate({ assignee })}
        />
      </div>

      <Separator />

      <div>
        <div className="text-xs font-medium text-muted-foreground mb-1">
          Labels
        </div>
        <div className="flex flex-wrap gap-1 mb-1">
          {issue.labels.map((label) => (
            <LabelBadge
              key={label.id}
              name={label.name}
              color={label.color}
            />
          ))}
        </div>
        <LabelPicker
          labels={labels}
          selectedIds={issue.labels.map((l) => l.id)}
          onChange={onLabelChange}
        />
      </div>

      <div>
        <div className="text-xs font-medium text-muted-foreground mb-1">
          Project
        </div>
        <ProjectPicker
          projects={projects}
          value={issue.projectId}
          onChange={(projectId) => onUpdate({ projectId })}
        />
      </div>

      <div>
        <div className="text-xs font-medium text-muted-foreground mb-1">
          Parent Issue
        </div>
        <ParentIssuePicker
          value={issue.parentId || null}
          currentIssueId={issue.id}
          onChange={(parentId) => onUpdate({ parentId })}
        />
      </div>

      <div>
        <div className="text-xs font-medium text-muted-foreground mb-1">
          Due Date
        </div>
        <DatePicker
          value={issue.dueDate || null}
          onChange={(val) => onUpdate({ dueDate: val })}
          className="h-8 text-sm bg-transparent"
        />
      </div>

      <Separator />

      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div>
          Created{" "}
          {new Date(issue.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div>
          Updated{" "}
          {new Date(issue.updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
