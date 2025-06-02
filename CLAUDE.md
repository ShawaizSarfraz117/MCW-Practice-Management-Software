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

### Development Workflow

1. Search existing codebase for similar implementations before writing new code
2. Use shared components from `packages/ui/` (add new ones via ShadCN if needed)
3. Follow established patterns for API routes, components, and utilities
4. Write tests (both unit and integration) for all new features
5. Run lint, typecheck, and tests before committing
6. Ensure HIPAA compliance and security best practices

## Pre-commit Checks

The project uses Husky and lint-staged for:

- ESLint with auto-fix
- Prettier formatting
- Type checking
- Test validation

Always run `npm run checks` before committing to ensure all quality gates pass.
