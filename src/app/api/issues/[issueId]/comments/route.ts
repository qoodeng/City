import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { comments, issues } from "@/lib/db/schema";
import { generateId, jsonResponse, errorResponse } from "@/lib/api-utils";
import { eq, asc } from "drizzle-orm";
import { createCommentSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params;

  const [issue, result] = await Promise.all([
    db.select({ id: issues.id }).from(issues).where(eq(issues.id, issueId)).get(),
    db
      .select()
      .from(comments)
      .where(eq(comments.issueId, issueId))
      .orderBy(asc(comments.createdAt)),
  ]);

  if (!issue) {
    return errorResponse("Issue not found", 404);
  }

  return jsonResponse(result);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params;

  try {
    const [issue, body] = await Promise.all([
      db.select({ id: issues.id }).from(issues).where(eq(issues.id, issueId)).get(),
      request.json(),
    ]);

    if (!issue) {
      return errorResponse("Issue not found", 404);
    }
    const { content } = createCommentSchema.parse(body);

    const id = generateId();
    const now = new Date().toISOString();

    db.insert(comments)
      .values({ id, issueId, content, createdAt: now, updatedAt: now })
      .run();

    const comment = await db.select().from(comments).where(eq(comments.id, id)).get();
    return jsonResponse(comment, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    logger.error(error, "Error creating comment");
    return errorResponse("Failed to create comment", 500);
  }
}
