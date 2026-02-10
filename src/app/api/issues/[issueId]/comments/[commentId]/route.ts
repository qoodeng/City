import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { eq } from "drizzle-orm";
import { updateCommentSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string; commentId: string }> }
) {
  const { commentId } = await params;

  const existing = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .get();
  if (!existing) {
    return errorResponse("Comment not found", 404);
  }

  try {
    const body = await request.json();
    const validated = updateCommentSchema.parse(body);

    db.update(comments)
      .set({ ...validated, updatedAt: new Date().toISOString() })
      .where(eq(comments.id, commentId))
      .run();

    const updated = await db.select().from(comments).where(eq(comments.id, commentId)).get();
    return jsonResponse(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    console.error("Error updating comment:", error);
    return errorResponse("Failed to update comment", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ issueId: string; commentId: string }> }
) {
  const { commentId } = await params;

  const existing = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .get();
  if (!existing) {
    return errorResponse("Comment not found", 404);
  }

  db.delete(comments).where(eq(comments.id, commentId)).run();
  return jsonResponse({ success: true });
}
