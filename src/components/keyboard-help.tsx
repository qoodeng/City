"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUT_GROUPS = [
  {
    title: "Global",
    shortcuts: [
      { keys: ["Cmd", "K"], description: "Command palette" },
      { keys: ["Cmd", "/"], description: "Toggle sidebar" },
      { keys: ["Cmd", "Z"], description: "Undo last action" },
      { keys: ["C"], description: "Create issue" },
      { keys: ["/"], description: "Search" },
      { keys: ["?"], description: "Show this help" },
      { keys: ["1"], description: "List view" },
      { keys: ["2"], description: "Board view" },
      { keys: ["Esc"], description: "Close / unfocus" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["J"], description: "Move down" },
      { keys: ["K"], description: "Move up" },
      { keys: ["G", "G"], description: "Jump to top" },
      { keys: ["Shift", "G"], description: "Jump to bottom" },
      { keys: ["Enter"], description: "Open focused issue" },
    ],
  },
  {
    title: "Issue Actions",
    shortcuts: [
      { keys: ["D"], description: "Mark done" },
      { keys: ["X"], description: "Mark cancelled" },
      { keys: ["B"], description: "Mark backlog" },
      { keys: ["T"], description: "Mark todo" },
      { keys: ["I"], description: "Mark in progress" },
      { keys: ["."], description: "Repeat last action" },
      { keys: ["Del"], description: "Delete issue" },
    ],
  },
  {
    title: "Pickers",
    shortcuts: [
      { keys: ["S"], description: "Status picker" },
      { keys: ["P"], description: "Priority picker" },
      { keys: ["L"], description: "Label picker" },
      { keys: ["#"], description: "Project picker" },
    ],
  },
];

export function KeyboardHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }
    window.addEventListener("city:keyboard-help", handleOpen);
    return () => window.removeEventListener("city:keyboard-help", handleOpen);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg bg-city-surface border-border max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 pt-2">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-medium text-city-yellow mb-2 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {shortcut.keys.map((key, i) => (
                        <span key={i}>
                          {i > 0 && (
                            <span className="text-muted-foreground/40 mx-0.5">
                              +
                            </span>
                          )}
                          <kbd className="px-1.5 py-0.5 rounded bg-city-black border border-border text-city-yellow text-[11px] font-mono">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
