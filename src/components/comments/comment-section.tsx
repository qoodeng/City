"use client";

import { useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { useCommentStore } from "@/lib/stores/comment-store";
import { CommentItem } from "./comment-item";
import { CommentComposer } from "./comment-composer";

const emptyState = (
  <div className="text-xs text-muted-foreground/60 py-2">
    No comments yet
  </div>
);

export function CommentSection({ issueId }: { issueId: string }) {
  const comments = useCommentStore((s) => s.comments);
  const loading = useCommentStore((s) => s.loading);
  const fetchComments = useCommentStore((s) => s.fetchComments);

  useEffect(() => {
    fetchComments(issueId);
  }, [issueId, fetchComments]);

  return (
    <div className="pt-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-medium text-muted-foreground">
          Comments
          {comments.length > 0 && (
            <span className="ml-2 text-xs opacity-60">{comments.length}</span>
          )}
        </h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-20 bg-city-surface animate-pulse rounded-md" />
        </div>
      ) : (
        <>
          {comments.length > 0 ? (
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  issueId={issueId}
                />
              ))}
            </div>
          ) : (
            emptyState
          )}
        </>
      )}

      <CommentComposer issueId={issueId} />
    </div>
  );
}
