import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { eq } from "drizzle-orm";
import { restoreProjectSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, status, color, icon, sortOrder, createdAt, updatedAt } =
      restoreProjectSchema.parse(body);

    // Prevent overwriting existing projects
    const existing = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, id)).get();
    if (existing) {
      return errorResponse("Project with this ID already exists", 409);
    }

    db.insert(projects)
      .values({
        id,
        name,
        description: description || null,
        status: status || "active",
        color: color || "#FFD700",
        icon: icon || "folder",
        sortOrder: sortOrder || 0,
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: updatedAt || new Date().toISOString(),
      })
      .run();

    const project = await db.select().from(projects).where(eq(projects.id, id)).get();
    return jsonResponse({ ...project, issueCount: 0, doneCount: 0 }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    logger.error(error, "Error restoring project");
    return errorResponse("Failed to restore project", 500);
  }
}
