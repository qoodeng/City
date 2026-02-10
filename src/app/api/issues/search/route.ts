import { NextRequest } from "next/server";
import { getSqlite } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { escapeFts5Query, parsePaginationInt } from "@/lib/sanitize";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");
  const limit = parsePaginationInt(searchParams.get("limit"), 20, 1, 100);

  if (!q?.trim()) {
    return jsonResponse([]);
  }

  try {
    const sqlite = getSqlite();
    const safeQuery = escapeFts5Query(q.trim());

    const results = sqlite
      .prepare(
        `SELECT
          i.id,
          i.number,
          i.title,
          i.status,
          i.priority,
          snippet(issues_fts, 0, '<mark>', '</mark>', '...', 32) as titleSnippet,
          snippet(issues_fts, 1, '<mark>', '</mark>', '...', 32) as descriptionSnippet,
          rank
        FROM issues_fts
        JOIN issues i ON issues_fts.rowid = i.rowid
        WHERE issues_fts MATCH ?
        ORDER BY rank
        LIMIT ?`
      )
      .all(safeQuery, limit);

    return jsonResponse(results);
  } catch (error) {
    console.error("FTS search error:", error);
    return errorResponse("Search failed", 500);
  }
}
