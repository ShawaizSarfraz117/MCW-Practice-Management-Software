# API Development Patterns

## API Development Pattern

All API routes follow this structure in `src/app/api/[feature]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // Implementation
    return NextResponse.json(data);
  } catch (error: unknown) {
    logger.error(`Operation failed: ${error?.message || error}`);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

## API Implementation Guidelines

- **File Structure**: `src/app/api/feature-name/route.ts`
- **HTTP Methods**: Export async functions named `GET`, `POST`, `PUT`, `DELETE`
- **Request Handling**: Use `NextRequest` and `NextResponse`
- **Error Handling**: Wrap in try/catch with proper status codes
- **Input Validation**: Validate all inputs before processing
- **Database**: Use shared Prisma client with transactions when needed
- **Logging**: Use `@mcw/logger` for structured logging

## Authentication & Authorization

- NextAuth.js handles authentication with role-based access
- Two primary roles: ADMIN and CLINICIAN
- Session verification required for protected routes
- Test credentials available in README.md
