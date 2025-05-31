# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Turborepo-based monorepo for a HIPAA-compliant medical practice management software. The codebase follows AI-first development principles where 95% of code is AI-generated while maintaining strict quality standards for security, privacy, and testing.

## Commands

### Development

```bash
npm run dev                  # Start all apps in development mode
npm run build               # Build all apps and packages
npm start                   # Start production servers
```

### Testing

```bash
npm test                    # Run all tests with test database
npm run test:unit           # Run unit tests only (mocked)
npm run test:integration    # Run integration tests with database
npm run test:ui             # Run UI tests
npm run test:ci             # CI-specific test command

# App-specific tests
npm run test:back-office:unit
npm run test:back-office:integration
npm run test:back-office:ui
npm run test:front-office:unit
npm run test:front-office:integration
npm run test:front-office:ui

# Run specific test file
npx vitest apps/back-office/__tests__/api/your-test-path
```

### Code Quality

```bash
npm run lint                # Run ESLint across workspace
npm run checks              # Run typecheck, prettier, and lint
npm run format              # Format code with Prettier
npm run typecheck           # TypeScript type checking
```

### Database

```bash
# Generate Prisma client (run from root)
npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Run migrations
npm run db:migrate          # Development migrations
npm run db:deploy           # Production migrations
npm run db:seed             # Seed database with initial data

# Database utilities
npm run db:generate         # Regenerate Prisma client
npx prisma studio --schema=./packages/database/prisma/schema.prisma  # Open Prisma Studio
```

## Architecture

### Monorepo Structure

- **apps/back-office**: Admin/therapist dashboard (Next.js 14 App Router)
- **apps/front-office**: Client-facing website (Next.js 14 App Router)
- **packages/database**: Prisma ORM with MS SQL Server
- **packages/ui**: Shared ShadCN-based UI components
- **packages/logger**: Centralized Pino-based logging
- **packages/utils**: Shared utilities and helpers
- **packages/types**: Shared TypeScript types

### Key Technologies

- **Framework**: Next.js 14 with App Router, TypeScript
- **Database**: MS SQL Server with Prisma ORM
- **Authentication**: NextAuth.js with role-based access (ADMIN, CLINICIAN)
- **UI**: Tailwind CSS with ShadCN components
- **Testing**: Vitest with comprehensive unit and integration tests
- **Logging**: Pino with request context and file rotation

### API Development Pattern

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

### Testing Strategy

**Unit Tests** (`.unit.test.ts`):

- Mock all dependencies using `vitest-mock-extended`
- Use `prismaMock` from `@mcw/database/mock`
- Test logic in isolation

**Integration Tests** (`.integration.test.ts`):

- Use real database with Docker
- Use Prisma factories for test data
- Clean up after each test

### Security Principles

- HIPAA compliance is mandatory
- No sensitive data in logs
- Authentication required for all API routes (unless explicitly public)
- Role-based authorization checks
- Soft deletes preferred over hard deletes

### Development Workflow

1. Requirements gathering (screenshots/sketches)
2. Figma wireframes (AI-generated)
3. Data model definition (ER diagram → Prisma schema)
4. Code generation from Figma using v0.dev
5. Comprehensive testing before feature completion
6. Separate deployment for back-office and front-office

### Important Guidelines

**From Cursor Rules**:

- Follow KISS & YAGNI principles
- Single responsibility for all functions
- Descriptive naming conventions
- Strict TypeScript (avoid `any`)
- Always use `catch (error: unknown)` pattern
- Mock boundaries at repository level for unit tests
- Integration tests use real database interactions

**API Implementation**:

- Use URL search params for GET filters: `request.nextUrl.searchParams`
- Return appropriate status codes (200, 201, 400, 404, 500)
- Log with context using `logger.fromRequest(request)`
- Validate input thoroughly (consider Zod for complex validation)
- Use transactions for multi-write operations

**Testing Requirements**:

- No feature is complete without tests
- Keep test files under 600 lines
- Use `createRequest` and `createRequestWithBody` from `@mcw/utils`
- Always run tests until all pass (no failures or pending)
- Account for JSON serialization (Date → ISO string, Decimal → string)

**Component Development**:

- Use shared components from `packages/ui`
- Add missing ShadCN components via CLI: `npx shadcn-ui@latest add <component> --cwd ./packages/ui`
- Follow existing patterns in the codebase
- Use Tailwind CSS for all styling
