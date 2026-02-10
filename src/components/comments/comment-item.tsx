"use client";

import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useCommentStore } from "@/lib/stores/comment-store";
import { useUndoStore } from "@/lib/stores/undo-store";
import { executeUndo } from "@/lib/undo-executor";
import type { Comment } from "@/types";
import { toast } from "sonner";
import { sanitizeHtml } from "@/lib/sanitize";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CommentItem({
  comment,
  issueId,
}: {
  comment: Comment;
  issueId: string;
}) {
  const [editing, setEditing] = useState(false);
  const updateComment = useCommentStore((s) => s.updateComment);
  const deleteComment = useCommentStore((s) => s.deleteComment);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: comment.content,
    editorProps: {
      attributes: {
        class: "tiptap prose prose-invert prose-sm max-w-none min-h-[60px] p-3 focus:outline-none",
      },
    },
  });

  const handleSave = useCallback(async () => {
    if (!editor) return;
    const html = editor.getHTML();
    if (!html || html === "<p></p>") return;

    await updateComment(issueId, comment.id, html);
    setEditing(false);
  }, [editor, issueId, comment.id, updateComment]);

  const handleCancel = useCallback(() => {
    editor?.commands.setContent(comment.content);
    setEditing(false);
  }, [editor, comment.content]);

  const handleDelete = useCallback(async () => {
    const success = await deleteComment(issueId, comment.id);
    if (success) {
      const entry = useUndoStore.getState().peekUndo();
      toast.success("Comment deleted", {
        action: entry
          ? { label: "Undo", onClick: () => executeUndo(entry) }
          : undefined,
      });
    }
  }, [issueId, comment.id, deleteComment]);

  return (
    <div className="group border border-border rounded-md bg-city-surface/50">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50">
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(comment.createdAt)}
          {comment.updatedAt !== comment.createdAt && " (edited)"}
        </span>
        {!editing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setEditing(true)}
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="p-2 space-y-2">
          <div className="rounded-md border border-border bg-city-surface">
            <EditorContent editor={editor} />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-city-yellow text-city-black hover:bg-city-yellow/90"
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="prose prose-invert prose-sm max-w-none p-3"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.content) }}
        />
      )}
    </div>
  );
}
