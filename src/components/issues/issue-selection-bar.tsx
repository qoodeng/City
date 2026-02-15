"use client";

import { X, Trash2, CheckCircle2, CircleOff, Archive, ArrowUpCircle } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui-store";
import { useIssueStore } from "@/lib/stores/issue-store";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function IssueSelectionBar() {
  const selectedIssueIds = useUIStore((s) => s.selectedIssueIds);
  const clearSelection = useUIStore((s) => s.clearSelection);
  const batchUpdateIssues = useIssueStore((s) => s.batchUpdateIssues);
  const batchDeleteIssues = useIssueStore((s) => s.batchDeleteIssues);

  const count = selectedIssueIds.size;
  const ids = Array.from(selectedIssueIds);

  const handleUpdate = (status: string) => {
    batchUpdateIssues(ids, { status });
    clearSelection();
  };

  const handleDelete = () => {
    if (confirm(`Delete ${count} issues?`)) {
      batchDeleteIssues(ids);
      clearSelection();
    }
  };

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-full shadow-2xl shadow-black/50"
        >
          <div className="flex items-center gap-2 pl-2 pr-2">
            <div className="flex items-center justify-center w-5 h-5 bg-city-yellow rounded-full text-city-black text-[10px] font-bold">
              {count}
            </div>
            <span className="text-sm font-medium text-zinc-200">selected</span>
          </div>

          <Separator orientation="vertical" className="h-6 bg-white/10" />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-city-yellow hover:bg-white/5 rounded-full"
              onClick={() => handleUpdate("done")}
              title="Mark Done (D)"
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-city-yellow hover:bg-white/5 rounded-full"
              onClick={() => handleUpdate("todo")}
              title="Mark Todo (T)"
            >
              <ArrowUpCircle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-city-yellow hover:bg-white/5 rounded-full"
              onClick={() => handleUpdate("cancelled")}
              title="Mark Cancelled (X)"
            >
              <CircleOff className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-city-yellow hover:bg-white/5 rounded-full"
              onClick={() => handleUpdate("backlog")}
              title="Mark Backlog (B)"
            >
              <Archive className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6 bg-white/10" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-full"
            onClick={handleDelete}
            title="Delete (Del)"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 bg-white/10" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full"
            onClick={clearSelection}
            title="Clear Selection (Esc)"
          >
            <X className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
