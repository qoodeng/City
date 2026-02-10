import { NextRequest } from "next/server";

export function createRequest(
  method: string,
  url: string,
  body?: unknown
): NextRequest {
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init as any);
}

export function createParams<T extends Record<string, string>>(
  params: T
): { params: Promise<T> } {
  return { params: Promise.resolve(params) };
}

export async function parseResponse<T = unknown>(
  response: Response
): Promise<{ data: T; status: number }> {
  const data = await response.json() as T;
  return { data, status: response.status };
}
