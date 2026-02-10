import { NextResponse } from "next/server";
import { getSqlite } from "@/lib/db";

export async function GET() {
  try {
    const sqlite = getSqlite();
    const result = sqlite.prepare("SELECT 1 AS ok").get() as { ok: number };

    if (result.ok !== 1) {
      return NextResponse.json(
        { status: "error", message: "Database check failed" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Database unreachable" },
      { status: 503 }
    );
  }
}
