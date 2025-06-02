# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCW Practice Management Software is a HIPAA-compliant healthcare practice management system built as a monorepo with two main applications:

- **Back Office**: Admin/clinician dashboard (`apps/back-office/`) - runs on port 3001
- **Front Office**: Client-facing portal (`apps/front-office/`) - runs on port 3000

The project prioritizes **safety, security, and privacy** as it handles medical records. The goal is to generate 95% of code via AI while maintaining strict quality standards through comprehensive testing.

## Architecture

### Monorepo Structure

- **Apps**: `apps/back-office/` and `apps/front-office/` (Next.js with App Router)
- **Packages**: Shared libraries in `packages/` including database, UI components, logger, types
- **Database**: Single Prisma schema shared across applications (`packages/database/`)
- **Build System**: Turborepo for orchestrating builds and tasks

### Technology Stack

- **Framework**: Next.js 14 with App Router and TypeScript
- **UI**: React + Tailwind CSS + ShadCN UI components (`packages/ui/`)
- **Database**: MS SQL Server with Prisma ORM
- **Authentication**: NextAuth.js with role-based access control
- **State Management**: TanStack Query for server state, React state for forms
- **Testing**: Vitest with comprehensive integration and unit testing
- **Logging**: Unified Pino-based logging system (`@mcw/logger`)

### Key Patterns

- **API Routes**: Next.js Route Handlers in `src/app/api/` following feature-based grouping
- **Database Access**: Shared Prisma client from `@mcw/database` package
- **Component Reuse**: Shared UI components in `packages/ui/` using ShadCN patterns
- **Type Safety**: Strict TypeScript with shared types in `@mcw/types`

## Development Commands

### Setup

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Update DATABASE_URL in .env.local

# Generate Prisma client and run migrations
npx prisma generate --schema=./packages/database/prisma/schema.prisma
npx prisma migrate dev
```

### Development

```bash
# Start all apps in development mode
npm run dev

# Start specific app
cd apps/back-office && npm run dev   # Port 3001
cd apps/front-office && npm run dev  # Port 3000

# Build all apps
npm run build

# Type checking
npm run typecheck

# Lint and format
npm run lint
npm run format
```

### Testing

The project uses comprehensive testing with different strategies:

```bash
# Run all tests (with test database)
npm test

# Specific test types
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests with database
npm run test:ui               # UI/component tests

# App-specific tests
npm run test:back-office:unit
npm run test:back-office:integration
npm run test:front-office:unit
npm run test:front-office:integration

# Run specific test file
npx vitest apps/back-office/__tests__/api/client/route.unit.test.ts

# Integration tests with local database
# Check packages/database/prisma/.env for your local database connection details
# Run single test: DATABASE_URL="<connection_string_from_env>" npx vitest __tests__/api/availability/route.integration.test.ts --run
# Run all integration tests: DATABASE_URL="<connection_string_from_env>" npx vitest --config=apps/back-office/vitest.config.integration.ts --run
```

### Database Operations

```bash
# Run migrations
npm run db:migrate

# Deploy to production database
npm run db:deploy

# Seed database
npm run db:seed

# Generate Prisma client
npm run db:generate

# Reset database for integration tests (when schema issues occur)
npx prisma migrate reset --schema=./packages/database/prisma/schema.prisma --force
```

## Testing Strategy

### Test Types

- **Unit Tests** (`.unit.test.ts`): Mock all dependencies using `prismaMock`
- **Integration Tests** (`.integration.test.ts`): Use real database with proper setup/teardown
- **UI Tests** (`.ui.test.tsx`): Component testing

### Key Testing Patterns

- Use `createRequest()` and `createRequestWithBody()` helpers from `@mcw/utils`
- Import API routes as `@/api/**/route` using path aliases
- For unit tests: Use `prismaMock` from `@mcw/database/mock`
- For integration tests: Use real `prisma` client with cleanup in `afterEach`
- Use factory functions for test data generation

### Test Database

Integration tests use a separate SQL Server instance via Docker:

- Runs on port 1434 (vs 1433 for development)
- Automatically started/stopped by `./scripts/run-vitest-with-testdb.sh`
- Database migrations applied automatically before tests

## Important Conventions

### API Implementation

- **File Structure**: `src/app/api/feature-name/route.ts`
- **HTTP Methods**: Export async functions named `GET`, `POST`, `PUT`, `DELETE`
- **Request Handling**: Use `NextRequest` and `NextResponse`
- **Error Handling**: Wrap in try/catch with proper status codes
- **Input Validation**: Validate all inputs before processing
- **Database**: Use shared Prisma client with transactions when needed
- **Logging**: Use `@mcw/logger` for structured logging

### Authentication & Authorization

- NextAuth.js handles authentication with role-based access
- Two primary roles: ADMIN and CLINICIAN
- Session verification required for protected routes
- Test credentials available in README.md

### Code Quality Requirements

- **Type Safety**: Strict TypeScript, avoid `any`
- **Error Handling**: Comprehensive error handling with proper logging
- **Testing**: No feature complete without adequate test coverage
- **Security**: HIPAA compliance, no secrets in code
- **Consistency**: Follow existing patterns in codebase

### Error Visibility for Development

- **Critical Rule**: All errors must trickle back to developers in ALL environments except production
- **Development/Staging/Testing**: Show maximum error information to developers (full stack traces, detailed messages, context)
- **Production Only**: Handle errors differently for end users (sanitized messages)
- **Implementation**: Always include error details in responses for non-production environments
- **Rationale**: Maximum error visibility saves significant development time by providing immediate feedback

### Security Principles

- HIPAA compliance is mandatory
- No sensitive data in logs
- Authentication required for all API routes (unless explicitly public)
- Role-based authorization checks
- Soft deletes preferred over hard deletes

### Development Workflow

1. Search existing codebase for similar implementations before writing new code
2. Use shared components from `packages/ui/` (add new ones via ShadCN if needed)
3. Follow established patterns for API routes, components, and utilities
4. Write tests (both unit and integration) for all new features
5. Run lint, typecheck, and tests before committing
6. Ensure HIPAA compliance and security best practices

### Important Guidelines

**From Cursor Rules**:

- Follow KISS & YAGNI principles
- Single responsibility for all functions
- Descriptive naming conventions
- Strict TypeScript (avoid `any`)
- Always use `catch (error: unknown)` pattern
- Mock boundaries at repository level for unit tests
- Integration tests use real database interactions

**Test Location and Naming Rules**:

- **Test Co-location**: All tests must be placed parallel to the source file they test, mirroring the exact `src/` directory structure in the `__tests__/` directory
- **⚠️ NEVER place test files in `src/` directories**: ESLint will error on any `.test.` or `.spec.` files found in `src/` - they must be in `__tests__/`
- **Speed-based Naming**: Use `.unit.test.ts/.tsx` for fast tests (< 2 seconds), `.integration.test.ts/.tsx` for slow tests (> 2 seconds)
- **DOM Environment Tests**: Use `.ui.test.tsx` for tests that need DOM environment (document, window objects) - these automatically use happy-dom environment
- **Test Documentation**: Only add documentation comments IN THE TEST FILE when a simple test is marked as `.integration.test` due to speed rather than complexity
- **Examples**:
  - Source: `src/app/(dashboard)/settings/page.tsx`
  - Test: `__tests__/(dashboard)/settings/page.unit.test.tsx` (fast, no DOM)
  - Test: `__tests__/(dashboard)/settings/page.ui.test.tsx` (needs DOM)
  - Test: `__tests__/(dashboard)/settings/page.integration.test.ts` (slow due to complexity)
  - Source: `src/app/api/client/route.ts`
  - Test: `__tests__/api/client/route.integration.test.ts` (due to database operations)

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

**Import Conventions**:

- **REQUIRED**: Use `@/` path aliases instead of relative imports with `../..` syntax
- For imports within the same app: Use `@/` (resolves to `src/`)
- For cross-package imports: Use `@mcw/package-name`
- Get user approval before using relative imports with `../..` paths
- Examples:

  ```typescript
  // ✅ Preferred - use @ aliases
  import { Component } from "@/components/Component";
  import { utils } from "@/utils/helpers";
  import { prisma } from "@mcw/database";

  // ❌ Avoid - relative imports
  import { Component } from "../../../components/Component";
  import { utils } from "../../utils/helpers";
  ```

- Use Tailwind CSS for all styling

## Fast Verification Commands

For quick verification that changes haven't broken anything, use these commands in order of speed:

### 1. Fastest - Linting (10-20 seconds)

```bash
npm run lint               # Full monorepo linting
npm run lint:back-office   # Back-office only (if available)
npm run lint:front-office  # Front-office only (if available)
```

**What it catches**: Import violations, code style issues, basic syntax errors

### 2. Fast - Type checking (30-60 seconds)

```bash
npm run typecheck          # Full monorepo TypeScript checking
```

**What it catches**: Type mismatches, missing imports, interface violations

### 3. Medium - Unit Tests (1-3 minutes)

```bash
npm run test:back-office:unit    # Back-office unit tests
npm run test:front-office:unit   # Front-office unit tests
npm test:unit                    # All unit tests
```

**What it catches**: Business logic errors, component behavior, mocked API responses

### 4. Slower - Integration Tests (3-10 minutes, requires Docker)

```bash
npm run test:back-office:integration    # Back-office with real database
npm run test:front-office:integration   # Front-office integration tests
npm test:integration                    # All integration tests
```

**What it catches**: Database schema issues, real API behavior, end-to-end workflows

### 5. Complete - All Checks (5-15 minutes)

```bash
npm run checks             # Lint + TypeCheck + Format check
npm test                   # All tests (unit + integration)
```

### Recommended Verification Strategy

**For small changes (import fixes, styling, minor refactors):**

```bash
npm run lint && npm run typecheck
```

**For logic changes (new features, API modifications):**

```bash
npm run lint && npm run typecheck && npm run test:unit
```

**For database/schema changes:**

```bash
npm run lint && npm run typecheck && npm test
```

### Import Convention Enforcement

The project now automatically prevents `../..` relative imports via ESLint:

```bash
# This will fail linting with helpful error message
import { Component } from "../../components/Component";  // ❌

# This will pass
import { Component } from "@/components/Component";      // ✅
```

Error message: "Use @/ path aliases instead of relative imports with ../.. - see CLAUDE.md Import Conventions"

## Pre-commit Checks

The project uses Husky and lint-staged for:

- ESLint with auto-fix
- Prettier formatting
- Type checking
- Test validation

Always run `npm run checks` before committing to ensure all quality gates pass.
