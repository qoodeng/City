import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export function generateId(): string {
  return nanoid();
}

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
