import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { labels } from "@/lib/db/schema";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { eq } from "drizzle-orm";
import { updateLabelSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ labelId: string }> }
) {
  const { labelId } = await params;

  const existing = await db
    .select()
    .from(labels)
    .where(eq(labels.id, labelId))
    .get();
  if (!existing) {
    return errorResponse("Label not found", 404);
  }

  try {
    const body = await request.json();
    const validated = updateLabelSchema.parse(body);

    db.update(labels)
      .set({ ...validated, updatedAt: new Date().toISOString() })
      .where(eq(labels.id, labelId))
      .run();

    const updated = await db
      .select()
      .from(labels)
      .where(eq(labels.id, labelId))
      .get();
    return jsonResponse(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    console.error("Error updating label:", error);
    return errorResponse("Failed to update label", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ labelId: string }> }
) {
  const { labelId } = await params;

  const existing = await db
    .select()
    .from(labels)
    .where(eq(labels.id, labelId))
    .get();
  if (!existing) {
    return errorResponse("Label not found", 404);
  }

  db.delete(labels).where(eq(labels.id, labelId)).run();
  return jsonResponse({ success: true });
}
