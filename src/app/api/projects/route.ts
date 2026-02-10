import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { projects, issues } from "@/lib/db/schema";
import { generateId, jsonResponse, errorResponse } from "@/lib/api-utils";
import { eq, sql } from "drizzle-orm";
import { createProjectSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function GET() {
  const [allProjects, counts] = await Promise.all([
    db.select().from(projects),
    db
      .select({
        projectId: issues.projectId,
        total: sql<number>`count(*)`,
        done: sql<number>`sum(case when ${issues.status} = 'done' then 1 else 0 end)`,
      })
      .from(issues)
      .groupBy(issues.projectId),
  ]);

  const countMap = new Map(
    counts.map((c) => [
      c.projectId,
      { issueCount: c.total, doneCount: c.done || 0 },
    ])
  );

  const result = allProjects.map((p) => ({
    ...p,
    issueCount: countMap.get(p.id)?.issueCount || 0,
    doneCount: countMap.get(p.id)?.doneCount || 0,
  }));

  return jsonResponse(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color, icon } = createProjectSchema.parse(body);

    const id = generateId();

    db.insert(projects)
      .values({
        id,
        name: name.trim(),
        description: description || null,
        color: color || "#FFD700",
        icon: icon || "folder",
        status: "active",
        sortOrder: 0,
      })
      .run();

    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .get();

    return jsonResponse({ ...project, issueCount: 0, doneCount: 0 }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    logger.error(error, "Error creating project");
    return errorResponse("Failed to create project", 500);
  }
}
