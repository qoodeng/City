import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { issues, issueLabels, labels, projects } from "@/lib/db/schema";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { eq, inArray } from "drizzle-orm";
import { restoreIssueSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = restoreIssueSchema.parse(body);

    const {
      id, number, title, description, status, priority,
      assignee, projectId, parentId, dueDate, sortOrder,
      createdAt, updatedAt, labels: labelData,
    } = validated;

    // Prevent overwriting existing issues
    const existing = await db.select({ id: issues.id }).from(issues).where(eq(issues.id, id)).get();
    if (existing) {
      return errorResponse("Issue with this ID already exists", 409);
    }

    // Insert the issue with explicit id and number (no counter bump)
    db.insert(issues)
      .values({
        id,
        number,
        title,
        description: description || null,
        status: status || "backlog",
        priority: priority || "none",
        assignee: assignee || null,
        projectId: projectId || null,
        parentId: parentId || null,
        dueDate: dueDate || null,
        sortOrder: sortOrder || 0,
        createdAt: createdAt || new Date().toISOString(),
        updatedAt: updatedAt || new Date().toISOString(),
      })
      .run();

    // Re-attach labels
    if (labelData && labelData.length > 0) {
      for (const label of labelData) {
        const labelId = typeof label === "string" ? label : label.id;
        if (labelId) {
          try {
            db.insert(issueLabels)
              .values({ issueId: id, labelId })
              .run();
          } catch {
            // Label may no longer exist
          }
        }
      }
    }

    // Fetch the restored issue with relations
    const [issue, issueLabelRows] = await Promise.all([
      db.select().from(issues).where(eq(issues.id, id)).get(),
      db
        .select({ label: labels })
        .from(issueLabels)
        .innerJoin(labels, eq(issueLabels.labelId, labels.id))
        .where(eq(issueLabels.issueId, id)),
    ]);

    const project = issue?.projectId
      ? await db.select().from(projects).where(eq(projects.id, issue.projectId)).get()
      : null;

    return jsonResponse(
      {
        ...issue,
        labels: issueLabelRows.map((r) => r.label),
        project: project || null,
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    console.error("Error restoring issue:", error);
    return errorResponse("Failed to restore issue", 500);
  }
}
