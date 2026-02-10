import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { labels } from "@/lib/db/schema";
import { generateId, jsonResponse, errorResponse } from "@/lib/api-utils";
import { eq } from "drizzle-orm";
import { createLabelSchema } from "@/lib/validation";

export async function GET() {
  const result = await db.select().from(labels);
  return jsonResponse(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color, description } = createLabelSchema.parse(body);

    const id = generateId();
    db.insert(labels)
      .values({
        id,
        name: name.trim(),
        color: color || "#6B7280",
        description: description || null,
      })
      .run();

    const label = await db.select().from(labels).where(eq(labels.id, id)).get();

    return jsonResponse(label, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    console.error("Error creating label:", error);
    return errorResponse("Failed to create label", 500);
  }
}
