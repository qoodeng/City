"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Add a description...",
  editable = true,
}: {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: "tiptap prose prose-invert prose-sm max-w-none min-h-[100px] p-3 focus:outline-none",
      },
    },
    onBlur({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="rounded-md border border-border bg-city-surface">
      <EditorContent editor={editor} />
    </div>
  );
}
