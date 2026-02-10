"use client";

import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { useCommentStore } from "@/lib/stores/comment-store";

export function CommentComposer({ issueId }: { issueId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const createComment = useCommentStore((s) => s.createComment);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Write a comment..." }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptap prose prose-invert prose-sm max-w-none min-h-[60px] p-3 focus:outline-none",
      },
    },
  });

  const handleSubmit = useCallback(async () => {
    if (!editor) return;
    const html = editor.getHTML();
    if (!html || html === "<p></p>") return;

    setSubmitting(true);
    const result = await createComment(issueId, html);
    if (result) {
      editor.commands.clearContent();
    }
    setSubmitting(false);
  }, [editor, issueId, createComment]);

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-border bg-city-surface">
        <EditorContent editor={editor} />
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-city-yellow text-city-black hover:bg-city-yellow/90"
        >
          Comment
        </Button>
      </div>
    </div>
  );
}
