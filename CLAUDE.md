# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL INSTRUCTIONS - MUST NEVER BE IGNORED

**DISCUSSION AND COLLABORATION REQUIREMENTS**:

- When the user says "let's discuss", "let's talk", or "let's brainstorm" - STOP and have a conversation
- NEVER implement or create documents when discussion is requested
- ALWAYS present options and wait for user input
- When user says "after we agree" - explicit agreement is required before proceeding
- Ask clarifying questions instead of making assumptions
- Present ideas for feedback, don't just execute

## Project Overview

MCW Practice Management Software is a HIPAA-compliant healthcare practice management system built as a Turborepo-based monorepo with two main applications:

- **Back Office**: Admin/clinician dashboard (`apps/back-office/`) - runs on port 3001
- **Front Office**: Client-facing portal (`apps/front-office/`) - runs on port 3000

The project prioritizes **safety, security, and privacy** as it handles medical records. The codebase follows AI-first development principles where 95% of code is AI-generated while maintaining strict quality standards for security, privacy, and testing.

## Architecture

### Monorepo Structure

- **apps/back-office**: Admin/clinician dashboard (Next.js 14 App Router) - port 3001
- **apps/front-office**: Client-facing portal (Next.js 14 App Router) - port 3000
- **packages/database**: Shared Prisma ORM schema with MS SQL Server
- **packages/ui**: Shared ShadCN-based UI components
- **packages/logger**: Centralized Pino-based logging with request context
- **packages/utils**: Shared utilities and helpers
- **packages/types**: Shared TypeScript types
- **Build System**: Turborepo for orchestrating builds and tasks

### Technology Stack

- **Framework**: Next.js 14 with App Router and TypeScript
- **UI**: React + Tailwind CSS + ShadCN UI components (`packages/ui/`)
- **Database**: MS SQL Server with Prisma ORM
- **Authentication**: NextAuth.js with role-based access control (ADMIN, CLINICIAN)
- **State Management**: TanStack Query for server state, React state for forms
- **Testing**: Vitest with comprehensive integration and unit testing
- **Logging**: Unified Pino-based logging system with request context and file rotation

### Key Patterns

- **API Routes**: Next.js Route Handlers in `src/app/api/` following feature-based grouping
- **Database Access**: Shared Prisma client from `@mcw/database` package
- **Component Reuse**: Shared UI components in `packages/ui/` using ShadCN patterns
- **Type Safety**: Strict TypeScript with shared types in `@mcw/types`

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

# Build all apps and packages
npm run build

# Type checking
npm run typecheck

# Lint and format
npm run lint
npm run format
npm run checks              # Run typecheck, prettier, and lint
```

### Testing

The project uses comprehensive testing with different strategies:

```bash
# Run all tests (with test database)
npm test

# Specific test types
npm run test:unit              # Unit tests only (mocked)
npm run test:integration       # Integration tests with database
npm run test:ui               # UI/component tests
npm run test:ci               # CI-specific test command

# App-specific tests
npm run test:back-office:unit
npm run test:back-office:integration
npm run test:back-office:ui
npm run test:front-office:unit
npm run test:front-office:integration
npm run test:front-office:ui

# Run specific test file
npx vitest apps/back-office/__tests__/api/client/route.unit.test.ts

# Integration tests with local database
# See "Credentials and Environment" section below for database connection details
# Run single test: DATABASE_URL="<connection_string_from_env>" npx vitest __tests__/api/availability/route.integration.test.ts --run
# Run all integration tests: DATABASE_URL="<connection_string_from_env>" npx vitest --config=apps/back-office/vitest.config.integration.ts --run
```

## Credentials and Environment

**IMPORTANT**: All required credentials for development and testing are stored in the root `.env` file.

### Database Connection

The project uses SQL Server database with credentials available in the root `.env` file:

```bash
# Check root .env file for DATABASE_URL value
# Format: sqlserver://server:port;database=name;user=username;password=password;trustServerCertificate=true
```

### Running Integration Tests Without Docker

When Docker is not available, use the database credentials directly from `.env`:

```bash
# Copy DATABASE_URL value from root .env file and use it like this:

# Single integration test
DATABASE_URL="<value_from_root_env_file>" npx vitest __tests__/api/client/route.integration.test.ts --run

# All back-office integration tests
DATABASE_URL="<value_from_root_env_file>" npx vitest --project back-office/integration --run

# All integration tests
DATABASE_URL="<value_from_root_env_file>" npx vitest .integration.test.ts --run
```

### Azure Storage Credentials

For blob storage and file upload functionality, the following credentials are needed in `.env`:

```bash
# Azure Storage (add these to .env when available)
AZURE_STORAGE_ACCOUNT_NAME="your_storage_account_name"
AZURE_STORAGE_ACCOUNT_KEY="your_storage_account_key"
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
AZURE_STORAGE_CONTAINER_NAME="uploads"
```

**Note**: These Azure Storage credentials are required for UI tests that involve file upload components to pass. Add them to the root `.env` file when available.

### Environment File Locations

1. **Primary**: `/mnt/e/repos/MCW-Practice-Management-Software/.env` (contains all credentials)
2. **Database specific**: `packages/database/prisma/.env` (references main .env)
3. **App specific**: `apps/back-office/.env.local` and `apps/front-office/.env.local` (optional overrides)

**Claude Code Memory Note**: Always use credentials from the root `.env` file for database connections and integration testing when Docker is not available.

### Database Operations

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

# Reset database for integration tests (when schema issues occur)
npx prisma migrate reset --schema=./packages/database/prisma/schema.prisma --force
```

## Testing Strategy

**📚 Comprehensive testing documentation**: See [TESTING_GUIDELINES.md](./Docs/TESTING_GUIDELINES.md) for detailed patterns, factory usage, and cleanup utilities.

### Test Types

- **Unit Tests** (`.unit.test.ts`): Mock all dependencies using `prismaMock`
- **Integration Tests** (`.integration.test.ts`): Use real database with proper setup/teardown
- **UI Tests** (`.ui.test.tsx`): Component testing

### Key Testing Patterns

- Use `createRequest()` and `createRequestWithBody()` helpers from `@mcw/utils`
- Import API routes using path aliases: `@/api/**/route`
- For unit tests: Use `prismaMock` from `@mcw/database/mock`
- For integration tests: Use real `prisma` client with cleanup in `afterEach`
- Use factory functions for test data generation

### Factory Functions and Database Cleanup

**IMPORTANT**: Always use existing factory functions and cleanup utilities instead of creating manual test data.

#### Factory Functions

The project uses auto-generated factories from `@mcw/database/mock-data`:

- **Plain object factories**: `UserFactory.build()` - for unit tests with mocks
- **Prisma factories**: `UserPrismaFactory.create()` - for integration tests with real database

```typescript
import { UserFactory, ClinicianPrismaFactory } from "@mcw/database/mock-data";

// Unit test - use plain factories
const mockUser = UserFactory.build();
prismaMock.user.findUnique.mockResolvedValue(mockUser);

// Integration test - use Prisma factories or plain factories with prisma.create
const user = await prisma.user.create({
  data: UserFactory.build(),
});
```

#### Database Cleanup

Use the centralized cleanup utilities from `@mcw/database/test-utils`:

```typescript
import { cleanupDatabase } from "@mcw/database/test-utils";

// In integration tests
afterEach(async () => {
  // Clean specific tables if needed
  await prisma.appointmentTag.deleteMany({});
});

afterAll(async () => {
  // Use centralized cleanup - handles foreign key constraints
  await cleanupDatabase(prisma, { verbose: false });
});
```

**Available cleanup functions**:

- `cleanupDatabase()` - Cleans all test data in correct order
- `cleanupTestUserData()` - Targeted cleanup for specific user data
- `safeCleanupDatabase()` - Wrapper with environment safety checks

**Never**:

- Create manual test data objects when factories exist
- Write custom cleanup code that duplicates existing utilities
- Use `eslint-disable max-lines-per-function` in test files - split tests instead

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

### File and Method Size Guidelines

**Keep code readable and maintainable by following these size constraints:**

#### File Size Limits

- **Component files**: Max 300 lines (extract sub-components if larger)
- **API route files**: Max 200 lines per route file
- **Test files**: Max 400 lines (split into multiple test files if needed)
- **Utility files**: Max 150 lines per file (group related utilities)

#### Method/Function Guidelines

- **Maximum lines**: 50 lines per function (ideal: 20-30 lines)
- **Single responsibility**: Each function does ONE thing well
- **Abstraction levels**: Don't mix high and low-level operations
- **Indentation depth**: Max 3 levels (excluding function definition)

#### Clean Code Patterns

```typescript
// ❌ BAD - Multiple abstraction levels, deep nesting
async function processAppointment(id: string) {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (appointment) {
    if (appointment.status === "pending") {
      // Database query (low level)
      const client = await prisma.client.findUnique({
        where: { id: appointment.client_id },
      });
      if (client && client.email) {
        // Business logic (high level)
        const fee = appointment.base_fee * 1.1;
        // Infrastructure concern (low level)
        await sendEmail(
          client.email,
          "Appointment reminder",
          `Your appointment is on ${appointment.date}`,
        );
        // More database operations...
      }
    }
  }
}

// ✅ GOOD - Single abstraction level, minimal nesting
async function processAppointment(id: string) {
  const appointment = await getAppointmentWithClient(id);
  if (!shouldProcessAppointment(appointment)) return;

  await notifyClient(appointment);
  await updateAppointmentFee(appointment);
}

// Extracted functions at consistent abstraction levels
async function getAppointmentWithClient(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: { client: true },
  });
}

function shouldProcessAppointment(
  appointment: AppointmentWithClient | null,
): boolean {
  return appointment?.status === "pending" && !!appointment.client?.email;
}

async function notifyClient(appointment: AppointmentWithClient) {
  const message = createAppointmentMessage(appointment);
  await sendEmail(appointment.client.email, "Appointment reminder", message);
}
```

#### Refactoring Triggers

- **Extract function** when:
  - A comment explains what a code block does
  - You see duplicate or similar code patterns
  - Indentation goes beyond 3 levels
  - A function exceeds 50 lines
- **Extract component** when:

  - A React component file exceeds 300 lines
  - A component has multiple responsibilities
  - You have large JSX blocks that could be named

- **Extract utility** when:
  - The same logic appears in multiple files
  - Complex calculations or transformations exist
  - Business rules need centralization

#### ESLint Configuration

The project enforces these rules - **never disable them**:

- `max-lines-per-function: ["error", 50]`
- `max-depth: ["error", 3]`
- `complexity: ["error", 10]`

Instead of disabling, refactor the code to comply.

### Error Visibility for Development

- **Critical Rule**: All errors must trickle back to developers in ALL environments except production
- **Development, staging, and testing**: Show maximum error information to developers (full stack traces, detailed messages, context)
- **Production Only**: Handle errors differently for end users (sanitized messages)
- **Implementation**: Always include error details in responses for non-production environments
- **Rationale**: Maximum error visibility saves significant development time by providing immediate feedback

### Error Handling Implementation

The project uses a centralized error handling system that provides maximum visibility in development while protecting sensitive information in production.

#### API Error Handling

All API routes should use the `withErrorHandling` wrapper:

```typescript
import { withErrorHandling } from "@mcw/utils";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Your route logic here
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Your route logic here
});
```

This wrapper automatically:

- **Catches uncaught exceptions** (500 errors)
- **Generates unique error IDs** in format: `ERR-YYYYMMDD-HHMMSS-XXXX`
- **Logs full error details** server-side with stack traces
- **Returns environment-appropriate responses**:
  - Development: Full error details with stack trace
  - Production: Sanitized message with issue ID only

#### Frontend Error Display

Use the centralized `showErrorToast` function in all mutations:

```typescript
import { showErrorToast } from "@mcw/utils";
import { toast } from "@mcw/ui";

const mutation = useMutation({
  mutationFn: myApiCall,
  onError: (error: unknown) => {
    showErrorToast(toast, error);
  },
});
```

This automatically:

- **Displays user-friendly error messages** in toasts
- **Shows issue IDs** for tracking (in case of 500 errors)
- **Logs full error details** to browser console in development
- **Makes toast text selectable** for easy copying

#### Error Response Formats

**Business Logic Errors (400, 401, 403, 404):**

```json
{
  "error": "Clear business error message"
}
// or
{
  "error": {
    "message": "Clear business error message",
    "details": "Additional context if needed"
  }
}
```

**Server Errors (500) - Development:**

```json
{
  "error": {
    "message": "Error message",
    "stack": "Full stack trace...",
    "issueId": "ERR-20250106-143052-X7K9",
    "timestamp": "2025-01-06T14:30:52.000Z"
  }
}
```

**Server Errors (500) - Production:**

```json
{
  "error": {
    "message": "An error occurred while processing your request",
    "issueId": "ERR-20250106-143052-X7K9"
  }
}
```

#### Key Benefits

1. **Consistent error handling** across all API routes
2. **Maximum visibility** for developers in non-production
3. **Secure error messages** in production
4. **Trackable errors** via unique issue IDs
5. **Selectable/copyable** error text in toasts
6. **Automatic logging** with proper context

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

**Type Safety Rules**:

We follow a strict three-layer type hierarchy. Types flow DOWN, never UP:

1. **Prisma types** (`@mcw/database`) → API routes only
2. **Shared types** (`@mcw/types`) → All shared business types
3. **App types** (`apps/*/src/types/`) → UI-specific only

See [Type System Architecture](./Docs/TYPE_SYSTEM_ARCHITECTURE.md) for detailed rules and examples.

**Validation**: Co-locate validation schemas with type definitions (see Architecture doc)

**Key Rules**:

- **ALWAYS use shared types from `@mcw/types` package** for all shared interfaces
- **Use Prisma types from `@mcw/database`** only when creating new shared types in `@mcw/types`
- **NEVER create duplicate type definitions** in individual components or pages
- **Follow naming conventions**: snake_case for API/DB, camelCase for UI
- Import order:
  1. First check `@mcw/types` for existing shared types
  2. If not found, create in `@mcw/types` using Prisma types from `@mcw/database`
  3. Never create local interfaces for data that comes from the database
- Example:

  ```typescript
  // Good - use shared types
  import { SafeUserWithRelations, TeamMembersResponse } from "@mcw/types";

  // Good - creating new shared types in packages/types
  import { User, Clinician } from "@mcw/database";
  export type SafeUser = Omit<User, "password_hash">;

  // Bad - creating local types in components
  interface TeamMember {
    id: string;
    email: string;
    // ... duplicating what's already in shared types
  }
  ```

**Type Conversion**:

- Use utilities from `@mcw/utils` for case conversion between snake_case and camelCase
- Keep database/API layer in snake_case
- Keep UI/form layer in camelCase

**Test Location and Naming Rules**:

- **Test Co-location**: All tests must be placed parallel to the source file they test, mirroring the exact `src/` directory structure in the `__tests__/` directory
- **⚠️ NEVER place test files in `src/` directories**: ESLint will error on any `.test.` or `.spec.` files found in `src/` - they must be in `__tests__/`
- **Test Naming Convention**:
  - `.unit.test.ts/.tsx`: Fast tests (< 2 seconds) that mock all dependencies
  - `.integration.test.ts/.tsx`: Tests using real dependencies (database, APIs) OR slow tests (> 2 seconds)
  - `.ui.test.tsx`: Tests that need DOM environment (document, window objects) - automatically use happy-dom
  - **Important**: If a test needs DOM, always use `.ui.test.tsx` regardless of speed
  - **Important**: Don't use arbitrary timeouts to make tests "integration" - fix the root cause instead
- **Examples**:
  - Source: `src/app/(dashboard)/settings/page.tsx`
  - Test: `__tests__/(dashboard)/settings/page.unit.test.tsx` (fast, no DOM)
  - Test: `__tests__/(dashboard)/settings/page.ui.test.tsx` (needs DOM)
  - Test: `__tests__/(dashboard)/settings/page.integration.test.ts` (slow due to complexity)
  - Source: `src/app/api/client/route.ts`
  - Test: `__tests__/api/client/route.integration.test.ts` (due to database operations)

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

**Recommended: Use the Local Testing Scripts**

```bash
# Interactive local check tool - choose what to test
npm run check:local

# Full pre-push verification - runs everything
npm run check:pre-push
```

See [Local Testing Guide](./Docs/LOCAL_TESTING_GUIDE.md) for detailed usage of these scripts.

For manual verification, use these commands in order of speed:

### 1. Fastest – Linting (10–20 seconds)

```bash
npm run lint               # Full monorepo linting
npm run lint:back-office   # Back-office only (if available)
npm run lint:front-office  # Front-office only (if available)
```

**What it catches**: Import violations, code style issues, basic syntax errors

### 2. Fast – Type checking (30–60 seconds)

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

## CRITICAL: Test Execution Guidelines

**🚨 MANDATORY**: You MUST run ALL tests including integration tests, but follow these guidelines to avoid timeouts:

### Quick Test Execution

**Use the quick test script for interactive testing:**

```bash
./scripts/test-quick.sh
# Or specify option directly:
./scripts/test-quick.sh 1  # Quick checks (lint + typecheck)
./scripts/test-quick.sh 2  # All unit tests
./scripts/test-quick.sh 3  # Client integration tests
```

### Manual Test Execution

1. **Unit Tests** - Run directly with npm scripts (safe to run all):

```bash
npm run test:unit                    # All unit tests (fast, mocked)
npm run test:back-office:unit        # Back-office unit tests only
npm run test:front-office:unit       # Front-office unit tests only
```

2. **Integration Tests** - Must be run in smaller batches to avoid timeouts:

```bash
# DO NOT run all integration tests at once - it will timeout!
# Get DATABASE_URL from .env first:
cat .env | grep DATABASE_URL

# Then run specific tests with the DATABASE_URL:
DATABASE_URL="<copy-from-env>" npx vitest run apps/back-office/__tests__/api/client/route.integration.test.ts
DATABASE_URL="<copy-from-env>" npx vitest run apps/back-office/__tests__/api/appointment/
DATABASE_URL="<copy-from-env>" npx vitest run apps/back-office/__tests__/api/service/route.integration.test.ts
```

3. **Real Example** - This is exactly how to run integration tests:

```bash
# Step 1: Get the DATABASE_URL
cat .env | grep DATABASE_URL
# Output: DATABASE_URL="sqlserver://192.168.1.114:1433;database=mcw-dev;user=sa;password=Zebra1234!;trustServerCertificate=true"

# Step 2: Run a specific integration test
DATABASE_URL="sqlserver://192.168.1.114:1433;database=mcw-dev;user=sa;password=Zebra1234!;trustServerCertificate=true" npx vitest run apps/back-office/__tests__/api/client/route.integration.test.ts
```

### Test Execution Strategy

**For PR verification and after changes:**

1. **First**: Run lint and typecheck (fast)

```bash
npm run lint && npm run typecheck
```

2. **Second**: Run unit tests (medium speed)

```bash
npm run test:unit
```

3. **Third**: Run integration tests in batches (slow)

```bash
# Pick relevant test directories based on your changes
npm run test:back-office:integration -- __tests__/api/<feature>/
```

### Common Test Patterns to Avoid Timeouts

**❌ DON'T DO THIS**:

```bash
npm test                          # Runs ALL tests - will timeout
npm run test:integration          # Runs ALL integration tests - will timeout
```

**✅ DO THIS INSTEAD**:

```bash
# Run tests for specific features you changed
npm run test:back-office:unit
npm run test:back-office:integration -- __tests__/api/client/
npm run test:back-office:integration -- __tests__/api/appointment/
```

### Test Failure Debugging

If tests fail, debug systematically:

1. **Check error messages** - They contain useful context
2. **Run single test** - Isolate the failing test
3. **Check test database** - Ensure migrations are applied
4. **Look for race conditions** - Integration tests may have timing issues

### Complete Testing Documentation

For comprehensive testing patterns, factory usage, and cleanup utilities, see:

- [TESTING_GUIDELINES.md](./Docs/TESTING_GUIDELINES.md)
- [HOW_TO_RUN_TESTS.md](./Docs/HOW_TO_RUN_TESTS.md)

## Pre-commit Checks

The project uses Husky and lint-staged for:

- ESLint with auto-fix
- Prettier formatting
- Type checking
- Test validation

Always run `npm run checks` before committing to ensure all quality gates pass.
