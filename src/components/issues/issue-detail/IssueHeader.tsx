"use client";

import { ArrowLeft, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { IssueWithLabels } from "@/types";

interface IssueHeaderProps {
  issue: IssueWithLabels | null;
  onDelete: () => Promise<void>;
}

export function IssueHeader({ issue, onDelete }: IssueHeaderProps) {
  return (
    <div className="flex items-center gap-2 h-12 px-4 border-b border-border shrink-0">
      <Link href="/issues">
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </Link>
      {issue?.parent && (
        <>
          <Link
            href={`/issues/${issue.parent.id}`}
            className="text-xs text-muted-foreground font-mono hover:text-city-yellow transition-colors"
          >
            City-{issue.parent.number}
          </Link>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </>
      )}
      {issue && (
        <span className="text-xs text-muted-foreground font-mono">
          City-{issue.number}
        </span>
      )}
      <div className="flex-1" />
      {issue && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
