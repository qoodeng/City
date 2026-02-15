import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { issues, issueLabels, labels, projects, comments, attachments } from "@/lib/db/schema";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { eq, inArray, sql } from "drizzle-orm";
import { updateIssueSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

async function getIssueWithRelations(id: string) {
  const issue = await db.select().from(issues).where(eq(issues.id, id)).get();
  if (!issue) return null;

  // Fetch labels, project, children, parent, and comment count in parallel
  const [issueLabelRows, project, children, parent, commentCountResult, attachmentRows] = await Promise.all([
    db
      .select({ label: labels })
      .from(issueLabels)
      .innerJoin(labels, eq(issueLabels.labelId, labels.id))
      .where(eq(issueLabels.issueId, id)),
    issue.projectId
      ? db
        .select()
        .from(projects)
        .where(eq(projects.id, issue.projectId))
        .get()
      : Promise.resolve(null),
    db
      .select()
      .from(issues)
      .where(eq(issues.parentId, id)),
    issue.parentId
      ? db
        .select({ id: issues.id, number: issues.number, title: issues.title })
        .from(issues)
        .where(eq(issues.id, issue.parentId))
        .get()
      : Promise.resolve(null),
    db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.issueId, id))
      .get(),
    db
      .select()
      .from(attachments)
      .where(eq(attachments.issueId, id)),
  ]);

  // Enrich children with their labels
  const childIds = children.map((c) => c.id);
  const childLabels = childIds.length > 0
    ? await db
      .select({ issueId: issueLabels.issueId, label: labels })
      .from(issueLabels)
      .innerJoin(labels, eq(issueLabels.labelId, labels.id))
      .where(inArray(issueLabels.issueId, childIds))
    : [];

  const childLabelMap = new Map<string, typeof labels.$inferSelect[]>();
  for (const row of childLabels) {
    const existing = childLabelMap.get(row.issueId) || [];
    existing.push(row.label);
    childLabelMap.set(row.issueId, existing);
  }

  const enrichedChildren = children.map((child) => ({
    ...child,
    labels: childLabelMap.get(child.id) || [],
    project: null,
  }));

  return {
    ...issue,
    labels: issueLabelRows.map((r) => r.label),
    project: project || null,
    children: enrichedChildren,
    parent: parent || null,
    commentCount: commentCountResult?.count ?? 0,
    attachments: attachmentRows,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params;
  const issue = await getIssueWithRelations(issueId);
  if (!issue) {
    return errorResponse("Issue not found", 404);
  }
  return jsonResponse(issue);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params;

  try {
    const body = await request.json();
    const validated = updateIssueSchema.parse(body);

    const existing = await db
      .select()
      .from(issues)
      .where(eq(issues.id, issueId))
      .get();
    if (!existing) {
      return errorResponse("Issue not found", 404);
    }

    const { labelIds, ...updateData } = validated;

    // Build update fields
    const fieldsToUpdate: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    const allowedFields = [
      "title",
      "description",
      "status",
      "priority",
      "assignee",
      "projectId",
      "parentId",
      "dueDate",
      "sortOrder",
    ] as const;

    for (const field of allowedFields) {
      if (field in updateData) {
        fieldsToUpdate[field] = updateData[field as keyof typeof updateData];
      }
    }

    // Validate parentId constraints
    if ("parentId" in updateData && updateData.parentId) {
      if (updateData.parentId === issueId) {
        return errorResponse("An issue cannot be its own parent");
      }
      const [wouldBeParent, existingChildren] = await Promise.all([
        db
          .select({ id: issues.id, parentId: issues.parentId })
          .from(issues)
          .where(eq(issues.id, updateData.parentId))
          .get(),
        db
          .select({ id: issues.id })
          .from(issues)
          .where(eq(issues.parentId, issueId))
          .limit(1),
      ]);
      if (!wouldBeParent) {
        return errorResponse("Parent issue not found", 404);
      }
      if (wouldBeParent.parentId) {
        return errorResponse("Cannot nest sub-issues more than one level deep");
      }
      if (existingChildren.length > 0) {
        return errorResponse("An issue with sub-issues cannot become a sub-issue itself");
      }
    }

    db.update(issues)
      .set(fieldsToUpdate)
      .where(eq(issues.id, issueId))
      .run();

    // Replace labels if provided — wrapped in transaction to prevent partial data loss
    if (labelIds !== undefined) {
      db.transaction((tx) => {
        tx.delete(issueLabels).where(eq(issueLabels.issueId, issueId)).run();
        if (labelIds.length > 0) {
          tx.insert(issueLabels)
            .values(labelIds.map((labelId) => ({ issueId, labelId })))
            .run();
        }
      });
    }

    const updated = await getIssueWithRelations(issueId);
    return jsonResponse(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    logger.error(error, "Error updating issue");
    return errorResponse("Failed to update issue", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params;

  const existing = await db
    .select()
    .from(issues)
    .where(eq(issues.id, issueId))
    .get();
  if (!existing) {
    return errorResponse("Issue not found", 404);
  }

  db.delete(issues).where(eq(issues.id, issueId)).run();
  return jsonResponse({ success: true });
}
