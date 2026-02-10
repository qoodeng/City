import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { labels } from "@/lib/db/schema";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { eq } from "drizzle-orm";
import { restoreLabelSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, color, description, createdAt, updatedAt } =
      restoreLabelSchema.parse(body);

    // Prevent overwriting existing labels
    const existing = await db.select({ id: labels.id }).from(labels).where(eq(labels.id, id)).get();
    if (existing) {
      return errorResponse("Label with this ID already exists", 409);
    }

    db.insert(labels)
      .values({
        id,
        name,
        color: color || "#6B7280",
        description: description || null,
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: updatedAt || new Date().toISOString(),
      })
      .run();

    const label = await db.select().from(labels).where(eq(labels.id, id)).get();
    return jsonResponse(label, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    logger.error(error, "Error restoring label");
    return errorResponse("Failed to restore label", 500);
  }
}
