"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/lib/stores/ui-store";
import { useIssueStore } from "@/lib/stores/issue-store";
import { useKeyboardStore } from "@/lib/stores/keyboard-store";
import { executeUndo } from "@/lib/undo-executor";
import { toast } from "sonner";

function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

function isDialogOpen(): boolean {
  return !!document.querySelector("[role='dialog']");
}

export function KeyboardShortcutHandler() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const {
        commandPaletteOpen,
        setCommandPaletteOpen,
        createIssueDialogOpen,
        setCreateIssueDialogOpen,
        setViewMode,
        toggleSidebar,
        focusedIssueId,
        setFocusedIssueId,
        inlinePicker,
        setInlinePicker,
        selectedIssueIds,
        selectAllIssues,
      } = useUIStore.getState();

      const {
        issues,
        updateIssue,
        deleteIssue,
        batchUpdateIssues,
        batchDeleteIssues,
        navigationIds,
      } = useIssueStore.getState();
      const keyboard = useKeyboardStore.getState();

      // === MODIFIER SHORTCUTS (work everywhere, even in inputs) ===

      // Cmd+A — select all
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        selectAllIssues(navigationIds);
        return;
      }

      // Cmd+K — command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
        return;
      }

      // Cmd+/ — toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Cmd+Z — undo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        executeUndo();
        return;
      }

      // Escape — close dialogs/pickers
      if (e.key === "Escape") {
        if (inlinePicker) {
          setInlinePicker(null);
          return;
        }
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
          return;
        }
        if (createIssueDialogOpen) {
          setCreateIssueDialogOpen(false);
          return;
        }
        if (focusedIssueId) {
          setFocusedIssueId(null);
          return;
        }
      }

      // Skip single-letter shortcuts when typing in inputs or dialogs are open
      if (isInputElement(e.target)) return;
      if (commandPaletteOpen || createIssueDialogOpen || isDialogOpen()) return;

      // If inline picker is open, let it handle keys
      if (inlinePicker) return;

      // === NAVIGATION ===

      // C — create issue
      if (e.key === "c" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setCreateIssueDialogOpen(true);
        return;
      }

      // 1 — list view
      if (e.key === "1") {
        e.preventDefault();
        setViewMode("list");
        return;
      }

      // 2 — board view
      if (e.key === "2") {
        e.preventDefault();
        setViewMode("board");
        return;
      }

      // / — focus search (open command palette)
      if (e.key === "/") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // ? — keyboard help
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        // Dispatch a custom event that KeyboardHelp listens for
        window.dispatchEvent(new CustomEvent("city:keyboard-help"));
        return;
      }

      // g key — buffer for gg (jump to top)
      if (e.key === "g" && !e.shiftKey) {
        const buffer = keyboard.pushKey("g");
        if (buffer.length >= 2 && buffer[buffer.length - 1] === "g" && buffer[buffer.length - 2] === "g") {
          e.preventDefault();
          keyboard.clearBuffer();
          if (issues.length > 0) {
            setFocusedIssueId(issues[0].id);
            const el = document.querySelector(`[data-issue-id="${CSS.escape(issues[0].id)}"]`);
            el?.scrollIntoView({ block: "nearest" });
          }
          return;
        }
        return;
      }

      // G (shift+g) — jump to bottom
      if (e.key === "G" && e.shiftKey) {
        e.preventDefault();
        keyboard.clearBuffer();
        if (issues.length > 0) {
          const last = issues[issues.length - 1];
          setFocusedIssueId(last.id);
          const el = document.querySelector(`[data-issue-id="${CSS.escape(last.id)}"]`);
          el?.scrollIntoView({ block: "nearest" });
        }
        return;
      }

      // J/K — navigate issues
      if ((e.key === "j" || e.key === "k") && !e.metaKey && !e.ctrlKey && issues.length > 0) {
        e.preventDefault();
        keyboard.clearBuffer();

        const { navigationIds } = useIssueStore.getState();
        const activeIds = navigationIds.length > 0
          ? navigationIds
          : issues.map((i) => i.id);

        if (activeIds.length === 0) return;

        const currentIndex = focusedIssueId
          ? activeIds.indexOf(focusedIssueId)
          : -1;

        let nextIndex: number;
        if (e.key === "j") {
          nextIndex = currentIndex < activeIds.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : activeIds.length - 1;
        }

        const nextId = activeIds[nextIndex];
        setFocusedIssueId(nextId);

        // Scroll into view
        const el = document.querySelector(
          `[data-issue-id="${CSS.escape(nextId)}"]`
        );
        el?.scrollIntoView({ block: "nearest" });
        return;
      }

      // Enter — open focused issue
      if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && focusedIssueId) {
        e.preventDefault();
        router.push(`/issues/${focusedIssueId}`);
        return;
      }

      // === STATUS SHORTCUTS (when issue is focused) ===
      const focusedIssue = focusedIssueId ? issues.find((i) => i.id === focusedIssueId) : null;

      if (selectedIssueIds.size > 0 || focusedIssue) {
        // d — mark done
        if (e.key === "d" && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          keyboard.clearBuffer();
          if (selectedIssueIds.size > 0) {
            batchUpdateIssues(Array.from(selectedIssueIds), { status: "done" });
          } else if (focusedIssue) {
            updateIssue(focusedIssue.id, { status: "done" });
            keyboard.setLastAction(
              () => {
                const current = useUIStore.getState().focusedIssueId;
                if (current)
                  useIssueStore.getState().updateIssue(current, { status: "done" });
              },
              "Mark done"
            );
          }
          return;
        }

        // x — mark cancelled
        if (e.key === "x" && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          keyboard.clearBuffer();
          if (selectedIssueIds.size > 0) {
            batchUpdateIssues(Array.from(selectedIssueIds), { status: "cancelled" });
          } else if (focusedIssue) {
            updateIssue(focusedIssue.id, { status: "cancelled" });
            keyboard.setLastAction(
              () => {
                const current = useUIStore.getState().focusedIssueId;
                if (current)
                  useIssueStore.getState().updateIssue(current, { status: "cancelled" });
              },
              "Mark cancelled"
            );
          }
          return;
        }

        // b — mark backlog
        if (e.key === "b" && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          keyboard.clearBuffer();
          if (selectedIssueIds.size > 0) {
            batchUpdateIssues(Array.from(selectedIssueIds), { status: "backlog" });
          } else if (focusedIssue) {
            updateIssue(focusedIssue.id, { status: "backlog" });
            keyboard.setLastAction(
              () => {
                const current = useUIStore.getState().focusedIssueId;
                if (current)
                  useIssueStore.getState().updateIssue(current, { status: "backlog" });
              },
              "Mark backlog"
            );
          }
          return;
        }

        // t — mark todo
        if (e.key === "t" && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          keyboard.clearBuffer();
          if (selectedIssueIds.size > 0) {
            batchUpdateIssues(Array.from(selectedIssueIds), { status: "todo" });
          } else if (focusedIssue) {
            updateIssue(focusedIssue.id, { status: "todo" });
            keyboard.setLastAction(
              () => {
                const current = useUIStore.getState().focusedIssueId;
                if (current)
                  useIssueStore.getState().updateIssue(current, { status: "todo" });
              },
              "Mark todo"
            );
          }
          return;
        }

        // i — mark in_progress
        if (e.key === "i" && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          keyboard.clearBuffer();
          if (selectedIssueIds.size > 0) {
            batchUpdateIssues(Array.from(selectedIssueIds), { status: "in_progress" });
          } else if (focusedIssue) {
            updateIssue(focusedIssue.id, { status: "in_progress" });
            keyboard.setLastAction(
              () => {
                const current = useUIStore.getState().focusedIssueId;
                if (current)
                  useIssueStore.getState().updateIssue(current, { status: "in_progress" });
              },
              "Mark in progress"
            );
          }
          return;
        }

        // === PICKER SHORTCUTS ===

        // s — open inline status picker
        if (e.key === "s" && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          keyboard.clearBuffer();
          setInlinePicker({ type: "status", issueId: focusedIssue.id });
          return;
        }

        // p — open inline priority picker
        if (e.key === "p" && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          keyboard.clearBuffer();
          setInlinePicker({ type: "priority", issueId: focusedIssue.id });
          return;
        }

        // l — open inline label picker
        if (e.key === "l" && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          keyboard.clearBuffer();
          setInlinePicker({ type: "label", issueId: focusedIssue.id });
          return;
        }

        // # — open inline project picker
        if (e.key === "#") {
          e.preventDefault();
          keyboard.clearBuffer();
          setInlinePicker({ type: "project", issueId: focusedIssue.id });
          return;
        }

        // . — repeat last action
        if (e.key === ".") {
          e.preventDefault();
          keyboard.clearBuffer();
          keyboard.repeatLastAction();
          return;
        }

        // Backspace / Delete — delete focused issue or selected issues
        if (
          (e.key === "Backspace" || e.key === "Delete") &&
          !e.metaKey &&
          !e.ctrlKey
        ) {
          e.preventDefault();
          keyboard.clearBuffer();
          if (selectedIssueIds.size > 0) {
            batchDeleteIssues(Array.from(selectedIssueIds)).then((success) => {
              if (success) {
                toast.success(`Deleted ${selectedIssueIds.size} issues`);
                useUIStore.getState().clearSelection();
              }
            });
          } else if (focusedIssue) {
            deleteIssue(focusedIssue.id).then((success) => {
              if (success) {
                toast.success(`Deleted City-${focusedIssue.number}`);
              }
            });
          }
          return;
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}
