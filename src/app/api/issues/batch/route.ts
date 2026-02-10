import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { issues } from "@/lib/db/schema";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { inArray } from "drizzle-orm";
import { batchUpdateSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueIds, updates } = batchUpdateSchema.parse(body);

    const fieldsToUpdate: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    const allowedFields = ["status", "priority", "assignee", "projectId"] as const;
    for (const field of allowedFields) {
      if (field in updates) {
        fieldsToUpdate[field] = updates[field as keyof typeof updates];
      }
    }

    db.update(issues)
      .set(fieldsToUpdate)
      .where(inArray(issues.id, issueIds))
      .run();

    return jsonResponse({ success: true, count: issueIds.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400);
    }
    logger.error(error, "Error batch updating issues");
    return errorResponse("Failed to batch update", 500);
  }
}
