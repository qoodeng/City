"use client";

import { useEffect, ReactNode } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useIssueStore } from "@/lib/stores/issue-store";
import { useLabelStore } from "@/lib/stores/label-store";
import { useProjectStore } from "@/lib/stores/project-store";

export function Providers({ children }: { children: ReactNode }) {
  const fetchIssues = useIssueStore((s) => s.fetchIssues);
  const fetchLabels = useLabelStore((s) => s.fetchLabels);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  useEffect(() => {
    // Fire all fetches concurrently (rule: async-parallel)
    void Promise.all([fetchIssues(), fetchLabels(), fetchProjects()]);
  }, [fetchIssues, fetchLabels, fetchProjects]);

  return (
    <NuqsAdapter>
      <TooltipProvider delayDuration={300}>
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "#1A1A1A",
              border: "1px solid #2A2A2A",
              color: "#E5E5E5",
            },
          }}
        />
      </TooltipProvider>
    </NuqsAdapter>
  );
}
