"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUIStore } from "@/lib/stores/ui-store";
import { useIssueStore } from "@/lib/stores/issue-store";
import { useLabelStore } from "@/lib/stores/label-store";
import { useProjectStore } from "@/lib/stores/project-store";
import { STATUSES, STATUS_CONFIG, PRIORITIES, PRIORITY_CONFIG } from "@/lib/constants";
import { StatusBadge } from "@/components/status-badge";
import { PriorityIcon } from "@/components/priority-icon";
import type { Status, Priority } from "@/lib/constants";
import { useUndoStore } from "@/lib/stores/undo-store";
import { executeUndo } from "@/lib/undo-executor";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";

export function IssueCreateDialog() {
  const createIssueDialogOpen = useUIStore((s) => s.createIssueDialogOpen);
  const setCreateIssueDialogOpen = useUIStore((s) => s.setCreateIssueDialogOpen);
  const createIssueParentId = useUIStore((s) => s.createIssueParentId);
  const setCreateIssueParentId = useUIStore((s) => s.setCreateIssueParentId);
  const createIssue = useIssueStore((s) => s.createIssue);
  const parentIssue = useIssueStore((s) =>
    createIssueParentId ? s.issues.find((i) => i.id === createIssueParentId) ?? null : null
  );
  const labels = useLabelStore((s) => s.labels);
  const projects = useProjectStore((s) => s.projects);

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<string>("backlog");
  const [priority, setPriority] = useState<string>("none");
  const [projectId, setProjectId] = useState<string>("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modifier, setModifier] = useState("Ctrl");

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.platform?.includes("Mac")) {
      setModifier("Cmd");
    }
  }, []);

  // Reset form when dialog opens / clear parent when it closes (synchronous state adjustment)
  const [prevOpen, setPrevOpen] = useState(false);
  if (createIssueDialogOpen !== prevOpen) {
    setPrevOpen(createIssueDialogOpen);
    if (createIssueDialogOpen) {
      setTitle("");
      setStatus("backlog");
      setPriority("none");
      setProjectId("");
      setSelectedLabelIds([]);
      setAssignee("");
      setDueDate("");
      setDescription("");
    } else {
      setCreateIssueParentId(null);
    }
  }

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);

    const issue = await createIssue({
      title: title.trim(),
      description: description || undefined,
      status,
      priority,
      projectId: projectId || undefined,
      parentId: createIssueParentId || undefined,
      labelIds: selectedLabelIds,
      assignee: assignee || undefined,
      dueDate: dueDate || undefined,
    });

    setSubmitting(false);

    if (issue) {
      const entry = useUndoStore.getState().peekUndo();
      toast.success(`Created City-${issue.number}`, {
        action: entry
          ? { label: "Undo", onClick: () => executeUndo(entry) }
          : undefined,
      });
      setCreateIssueDialogOpen(false);
    } else {
      toast.error("Failed to create issue");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  return (
    <Dialog
      open={createIssueDialogOpen}
      onOpenChange={setCreateIssueDialogOpen}
    >
      <DialogContent
        className="sm:max-w-lg bg-city-surface border-border"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">
            Create Issue
            {parentIssue && (
              <span className="ml-2 text-xs font-normal text-muted-foreground bg-city-surface px-2 py-0.5 rounded">
                Sub-issue of City-{parentIssue.number}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Input
              placeholder="Issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-0 bg-transparent text-base font-medium placeholder:text-muted-foreground focus-visible:ring-0 px-0 h-auto py-1"
              autoFocus
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-auto h-7 text-xs gap-1.5 bg-transparent border-border">
                <StatusBadge status={status as Status} size={12} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={s} size={12} />
                      {STATUS_CONFIG[s].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-auto h-7 text-xs gap-1.5 bg-transparent border-border">
                <PriorityIcon priority={priority as Priority} size={12} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    <div className="flex items-center gap-2">
                      <PriorityIcon priority={p} size={12} />
                      {PRIORITY_CONFIG[p].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {projects.length > 0 && (
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="w-auto h-7 text-xs gap-1.5 bg-transparent border-border">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-sm"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <DatePicker
              value={dueDate || null}
              onChange={(val) => setDueDate(val || "")}
              className="w-auto h-7 text-xs bg-transparent border-border"
            />
          </div>

          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {labels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => toggleLabel(label.id)}
                  className="text-xs px-2 py-0.5 rounded-full border transition-colors"
                  style={{
                    backgroundColor: selectedLabelIds.includes(label.id)
                      ? `${label.color}30`
                      : "transparent",
                    borderColor: selectedLabelIds.includes(label.id)
                      ? label.color
                      : "#2A2A2A",
                    color: selectedLabelIds.includes(label.id)
                      ? label.color
                      : "#737373",
                  }}
                >
                  {label.name}
                </button>
              ))}
            </div>
          )}

          <div>
            <Input
              placeholder="Assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="h-8 text-sm bg-transparent border-border"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-muted-foreground">
              {modifier}+Enter to
              submit
            </span>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || submitting}
              className="bg-city-yellow text-city-black hover:bg-city-yellow-bright h-8 text-sm"
            >
              Create Issue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
