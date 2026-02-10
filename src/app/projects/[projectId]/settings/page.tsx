"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDeferredLoading } from "@/lib/hooks/use-deferred-loading";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useProjectStore } from "@/lib/stores/project-store";
import {
  PROJECT_COLORS,
  PROJECT_STATUSES,
  type ProjectStatus,
} from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { updateProject, deleteProject } = useProjectStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [status, setStatus] = useState<string>("active");
  const [loading, setLoading] = useState(true);
  const showSkeleton = useDeferredLoading(loading);

  // Synchronous reset when navigating between project settings
  const [prevProjectId, setPrevProjectId] = useState(projectId);
  if (projectId !== prevProjectId) {
    setPrevProjectId(projectId);
    setName("");
    setDescription("");
    setColor("");
    setStatus("active");
    setLoading(true);
  }

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setName(data.name);
        setDescription(data.description || "");
        setColor(data.color);
        setStatus(data.status);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleSave = async () => {
    const success = await updateProject(projectId, {
      name: name.trim(),
      description: description || null,
      color,
      status,
    });
    if (success) {
      toast.success("Project updated");
    }
  };

  const handleDelete = async () => {
    const success = await deleteProject(projectId);
    if (success) {
      toast.success("Project deleted");
      router.push("/projects");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header — always visible */}
      <div className="flex items-center gap-2 h-12 px-4 border-b border-border shrink-0">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <span className="text-sm font-medium">Project Settings</span>
      </div>

      {/* Form — transitions per project */}
      {loading ? (
        showSkeleton ? (
          <div className="flex-1 p-6 space-y-4 animate-fade-in">
            <div className="h-8 w-48 bg-city-surface animate-pulse rounded" />
          </div>
        ) : null
      ) : (
      <div key={projectId} className="flex-1 overflow-auto p-6 max-w-lg space-y-6 animate-fade-in">
        <div>
          <Label className="text-xs text-muted-foreground">Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 bg-transparent"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 bg-transparent min-h-20"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="mt-1 bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Color</Label>
          <div className="flex gap-2 mt-1.5">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                className={cn(
                  "w-6 h-6 rounded-full transition-transform",
                  color === c &&
                    "ring-2 ring-offset-2 ring-offset-background scale-110"
                )}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <Button
          onClick={handleSave}
          className="bg-city-yellow text-city-black hover:bg-city-yellow-bright"
        >
          Save Changes
        </Button>

        <Separator />

        <div>
          <h3 className="text-sm font-medium text-destructive mb-2">
            Danger Zone
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Deleting this project will unassign all issues from it.
          </p>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete Project
          </Button>
        </div>
      </div>
      )}
    </div>
  );
}
