import { NextRequest } from "next/server";

export function createRequest(path: string, options?: RequestInit) {
  return new NextRequest(new Request(`http://localhost:3000${path}`, options));
}

export function createRequestWithBody(
  path: string,
  body: Record<string, unknown>,
  options?: RequestInit,
) {
  return new NextRequest(
    new Request(`http://localhost:3000${path}`, {
      method: "POST",
      ...options,
      body: JSON.stringify(body),
    }),
  );
}
