import { db } from "@/lib/db";
import { issues, issueLabels, labels, projects } from "@/lib/db/schema";
import { jsonResponse } from "@/lib/api-utils";
import { eq, and, inArray, not, sql, desc, lte, gte } from "drizzle-orm";

async function enrichIssues(rawIssues: (typeof issues.$inferSelect)[]) {
  if (rawIssues.length === 0) return [];

  const issueIds = rawIssues.map((i) => i.id);
  const projectIds = [
    ...new Set(rawIssues.map((i) => i.projectId).filter(Boolean)),
  ] as string[];

  const [allIssueLabels, allProjects] = await Promise.all([
    db
      .select({ issueId: issueLabels.issueId, label: labels })
      .from(issueLabels)
      .innerJoin(labels, eq(issueLabels.labelId, labels.id))
      .where(inArray(issueLabels.issueId, issueIds)),
    projectIds.length > 0
      ? db.select().from(projects).where(inArray(projects.id, projectIds))
      : Promise.resolve([]),
  ]);

  const projectMap = new Map(allProjects.map((p) => [p.id, p]));
  const labelsByIssue = new Map<string, typeof labels.$inferSelect[]>();
  for (const row of allIssueLabels) {
    const existing = labelsByIssue.get(row.issueId) || [];
    existing.push(row.label);
    labelsByIssue.set(row.issueId, existing);
  }

  return rawIssues.map((issue) => ({
    ...issue,
    labels: labelsByIssue.get(issue.id) || [],
    project: issue.projectId ? projectMap.get(issue.projectId) || null : null,
  }));
}

export async function GET() {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [dueThisWeekRaw, recentlyUpdatedRaw, staleIssuesRaw, statusDistribution, totalResult] =
    await Promise.all([
      // Due this week: issues with dueDate in next 7 days, not done/cancelled
      db
        .select()
        .from(issues)
        .where(
          and(
            not(inArray(issues.status, ["done", "cancelled"])),
            lte(issues.dueDate, weekFromNow.toISOString().split("T")[0]),
            gte(issues.dueDate, now.toISOString().split("T")[0])
          )
        )
        .orderBy(issues.dueDate),

      // Recently updated: last 10
      db
        .select()
        .from(issues)
        .orderBy(desc(issues.updatedAt))
        .limit(10),

      // Stale: in_progress with updatedAt > 7 days ago
      db
        .select()
        .from(issues)
        .where(
          and(
            eq(issues.status, "in_progress"),
            lte(issues.updatedAt, weekAgo.toISOString())
          )
        )
        .orderBy(issues.updatedAt),

      // Status distribution
      db
        .select({
          status: issues.status,
          count: sql<number>`count(*)`,
        })
        .from(issues)
        .groupBy(issues.status),

      // Total count
      db
        .select({ count: sql<number>`count(*)` })
        .from(issues),
    ]);

  const [dueThisWeek, recentlyUpdated, staleIssues] = await Promise.all([
    enrichIssues(dueThisWeekRaw),
    enrichIssues(recentlyUpdatedRaw),
    enrichIssues(staleIssuesRaw),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const row of statusDistribution) {
    statusCounts[row.status] = row.count;
  }

  return jsonResponse({
    dueThisWeek,
    recentlyUpdated,
    staleIssues,
    statusDistribution: statusCounts,
    totalIssues: totalResult[0]?.count || 0,
  });
}
