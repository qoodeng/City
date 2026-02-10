import { NextRequest } from "next/server";
import { z } from "zod";
import { db, getSqlite } from "@/lib/db";
import {
  issues,
  issueLabels,
  labels,
  counters,
  projects,
  comments,
} from "@/lib/db/schema";
import { generateId, jsonResponse, errorResponse } from "@/lib/api-utils";
import { eq, desc, asc, and, inArray, sql, SQL } from "drizzle-orm";
import { createIssueSchema } from "@/lib/validation";
import { escapeFts5Query, escapeLikePattern, parsePaginationInt } from "@/lib/sanitize";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.getAll("status");
  const priority = searchParams.getAll("priority");
  const projectId = searchParams.get("projectId");
  const labelIds = searchParams.getAll("label");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "created";
  const order = searchParams.get("order") || "desc";
  const page = parsePaginationInt(searchParams.get("page"), 1, 1, 10000);
  const limit = parsePaginationInt(searchParams.get("limit"), 50, 1, 200);
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];

  if (status.length > 0) {
    conditions.push(inArray(issues.status, status));
  }
  if (priority.length > 0) {
    conditions.push(inArray(issues.priority, priority));
  }
  if (projectId) {
    conditions.push(eq(issues.projectId, projectId));
  }
  if (search) {
    try {
      const sqlite = getSqlite();
      const safeQuery = escapeFts5Query(search);
      const ftsResults = sqlite
        .prepare("SELECT i.id FROM issues_fts JOIN issues i ON issues_fts.rowid = i.rowid WHERE issues_fts MATCH ? LIMIT 200")
        .all(safeQuery) as { id: string }[];
      const ftsIds = ftsResults.map((r) => r.id);
      if (ftsIds.length > 0) {
        conditions.push(inArray(issues.id, ftsIds));
      } else {
        conditions.push(sql`1 = 0`);
      }
    } catch {
      // Fallback to LIKE if FTS query syntax is invalid — escape LIKE metacharacters
      const escaped = escapeLikePattern(search);
      conditions.push(sql`${issues.title} LIKE ${'%' + escaped + '%'} ESCAPE '\\'`);
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = {
    created: issues.createdAt,
    updated: issues.updatedAt,
    priority: issues.priority,
    due_date: issues.dueDate,
    title: issues.title,
    number: issues.number,
  }[sort] || issues.createdAt;

  const orderFn = order === "asc" ? asc : desc;

  let result = await db
    .select()
    .from(issues)
    .where(where)
    .orderBy(orderFn(sortColumn))
    .limit(limit)
    .offset(offset);

  // If filtering by labels, do it in a second pass
  if (labelIds.length > 0) {
    const issueLabelRows = await db
      .select({ issueId: issueLabels.issueId })
      .from(issueLabels)
      .where(inArray(issueLabels.labelId, labelIds));
    const issueIdsWithLabel = new Set(issueLabelRows.map((r) => r.issueId));
    result = result.filter((issue) => issueIdsWithLabel.has(issue.id));
  }

  // Fetch labels and projects in parallel (rule: async-parallel)
  const issueIds = result.map((i) => i.id);
  const projectIds = [
    ...new Set(result.map((i) => i.projectId).filter(Boolean)),
  ] as string[];

  const [allIssueLabels, allProjects, commentCounts] = await Promise.all([
    issueIds.length > 0
      ? db
        .select({
          issueId: issueLabels.issueId,
          label: labels,
        })
        .from(issueLabels)
        .innerJoin(labels, eq(issueLabels.labelId, labels.id))
        .where(inArray(issueLabels.issueId, issueIds))
      : Promise.resolve([]),
    projectIds.length > 0
      ? db
        .select()
        .from(projects)
        .where(inArray(projects.id, projectIds))
      : Promise.resolve([]),
    issueIds.length > 0
      ? db
        .select({
          issueId: comments.issueId,
          count: sql<number>`count(*)`,
        })
        .from(comments)
        .where(inArray(comments.issueId, issueIds))
        .groupBy(comments.issueId)
      : Promise.resolve([]),
  ]);
  const projectMap = new Map(allProjects.map((p) => [p.id, p]));
  const commentCountMap = new Map(commentCounts.map((c) => [c.issueId, c.count]));

  const labelsByIssue = new Map<string, typeof labels.$inferSelect[]>();
  for (const row of allIssueLabels) {
    const existing = labelsByIssue.get(row.issueId) || [];
    existing.push(row.label);
    labelsByIssue.set(row.issueId, existing);
  }

  const enriched = result.map((issue) => ({
    ...issue,
    labels: labelsByIssue.get(issue.id) || [],
    project: issue.projectId ? projectMap.get(issue.projectId) || null : null,
    commentCount: commentCountMap.get(issue.id) ?? 0,
  }));

  return jsonResponse(enriched);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createIssueSchema.parse(body);
    const { title, description, status, priority, assignee, projectId, parentId, dueDate, labelIds } = validatedData;

    const id = generateId();

    // Atomic counter increment
    db.transaction((tx) => {
      tx.update(counters)
        .set({ value: sql`${counters.value} + 1` })
        .where(eq(counters.id, "issue_counter"))
        .run();

      const counter = tx
        .select()
        .from(counters)
        .where(eq(counters.id, "issue_counter"))
        .get();

      const number = counter!.value;

      tx.insert(issues)
        .values({
          id,
          number,
          title: title.trim(),
          description: description || null,
          status: status || "backlog",
          priority: priority || "none",
          assignee: assignee || null,
          projectId: projectId || null,
          parentId: parentId || null,
          dueDate: dueDate || null,
          sortOrder: 0,
        })
        .run();

      // Insert labels
      if (labelIds && labelIds.length > 0) {
        tx.insert(issueLabels)
          .values(labelIds.map((labelId: string) => ({ issueId: id, labelId })))
          .run();
      }

      return number;
    });

    // Fetch created issue, labels, and project in parallel (rule: async-parallel)
    const [issue, issueLabelRows, project] = await Promise.all([
      db.select().from(issues).where(eq(issues.id, id)).get(),
      db
        .select({ label: labels })
        .from(issueLabels)
        .innerJoin(labels, eq(issueLabels.labelId, labels.id))
        .where(eq(issueLabels.issueId, id)),
      projectId
        ? db.select().from(projects).where(eq(projects.id, projectId)).get()
        : Promise.resolve(null),
    ]);

    return jsonResponse(
      {
        ...issue,
        labels: issueLabelRows.map((r) => r.label),
        project,
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    console.error("Error creating issue:", error);
    return errorResponse("Failed to create issue", 500);
  }
}
