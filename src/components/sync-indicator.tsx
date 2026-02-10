"use client";

import { useSyncStore } from "@/lib/stores/sync-store";
import { Check, AlertCircle } from "lucide-react";
import { CrashSpinner } from "@/components/crash-spinner";

export function SyncIndicator() {
  const { pendingCount, lastError } = useSyncStore();

  if (lastError) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive px-2 py-1">
        <AlertCircle className="w-3 h-3" />
        <span className="truncate">Error</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1">
        <CrashSpinner className="w-3 h-3" />
        <span>Syncing...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50 px-2 py-1">
      <Check className="w-3 h-3" />
      <span>Saved</span>
    </div>
  );
}
