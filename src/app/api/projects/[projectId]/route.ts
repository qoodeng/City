import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { projects, issues } from "@/lib/db/schema";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { eq, sql } from "drizzle-orm";
import { updateProjectSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const [project, counts] = await Promise.all([
    db.select().from(projects).where(eq(projects.id, projectId)).get(),
    db
      .select({
        total: sql<number>`count(*)`,
        done: sql<number>`sum(case when ${issues.status} = 'done' then 1 else 0 end)`,
      })
      .from(issues)
      .where(eq(issues.projectId, projectId))
      .get(),
  ]);

  if (!project) {
    return errorResponse("Project not found", 404);
  }

  return jsonResponse({
    ...project,
    issueCount: counts?.total || 0,
    doneCount: counts?.done || 0,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const existing = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .get();
  if (!existing) {
    return errorResponse("Project not found", 404);
  }

  try {
    const body = await request.json();
    const validated = updateProjectSchema.parse(body);

    db.update(projects)
      .set({ ...validated, updatedAt: new Date().toISOString() })
      .where(eq(projects.id, projectId))
      .run();

    const updated = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get();

    return jsonResponse(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    console.error("Error updating project:", error);
    return errorResponse("Failed to update project", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  // Unassign issues from this project
  db.update(issues)
    .set({ projectId: null })
    .where(eq(issues.projectId, projectId))
    .run();

  db.delete(projects).where(eq(projects.id, projectId)).run();
  return jsonResponse({ success: true });
}
