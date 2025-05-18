import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  console.log("[Middleware] Path:", req.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply middleware to all routes except static assets and Next.js internals
    "/((?!api/|_next/static|_next/image|favicon.ico).*)",
  ],
};
