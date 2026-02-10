"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useProjectStore } from "@/lib/stores/project-store";
import { PROJECT_COLORS } from "@/lib/constants";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ProjectCreateDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(PROJECT_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);
  const createProject = useProjectStore((s) => s.createProject);

  const handleSubmit = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);

    const project = await createProject({
      name: name.trim(),
      description: description || undefined,
      color,
    });

    setSubmitting(false);

    if (project) {
      toast.success(`Created project "${project.name}"`);
      setOpen(false);
      setName("");
      setDescription("");
      setColor(PROJECT_COLORS[0]);
    } else {
      toast.error("Failed to create project");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-7 bg-city-yellow text-city-black hover:bg-city-yellow-bright"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-city-surface border-border">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">
            Create Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 bg-transparent"
              placeholder="Project name"
              autoFocus
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 bg-transparent min-h-16"
              placeholder="Project description (optional)"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Color</Label>
            <div className="flex gap-2 mt-1.5">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  className={cn(
                    "w-6 h-6 rounded-full transition-transform",
                    color === c && "ring-2 ring-offset-2 ring-offset-city-surface scale-110"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || submitting}
              className="bg-city-yellow text-city-black hover:bg-city-yellow-bright h-8 text-sm"
            >
              Create Project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
