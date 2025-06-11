# How to Run Tests - Complete Guide

This guide provides step-by-step instructions for running tests in the MCW Practice Management Software project without encountering timeouts or failures.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Types](#test-types)
3. [Running Tests Without Timeouts](#running-tests-without-timeouts)
4. [Environment Setup](#environment-setup)
5. [Common Issues and Solutions](#common-issues-and-solutions)
6. [CI/CD Test Execution](#cicd-test-execution)

## Quick Start

For most development work, follow this sequence:

```bash
# 1. Verify code quality (10-20 seconds)
npm run lint && npm run typecheck

# 2. Run unit tests (1-3 minutes)
npm run test:unit

# 3. Run relevant integration tests (varies)
npm run test:back-office:integration -- __tests__/api/client/
```

## Test Types

### Unit Tests (`.unit.test.ts`)

- **Speed**: Fast (< 2 seconds per test)
- **Dependencies**: All mocked
- **Database**: Uses `prismaMock`
- **When to run**: After every change

### Integration Tests (`.integration.test.ts`)

- **Speed**: Slow (2-30 seconds per test)
- **Dependencies**: Real database, APIs
- **Database**: Real SQL Server instance
- **When to run**: Before commits, after database changes

### UI Tests (`.ui.test.tsx`)

- **Speed**: Medium
- **Dependencies**: DOM environment (happy-dom)
- **Database**: Usually mocked
- **When to run**: After UI component changes

## Running Tests Without Timeouts

### Unit Tests - Safe to Run All

```bash
# Run all unit tests across the monorepo
npm run test:unit

# Run unit tests for specific app
npm run test:back-office:unit
npm run test:front-office:unit

# Run specific unit test file
npx vitest run apps/back-office/__tests__/api/client/route.unit.test.ts
```

### Integration Tests - Run in Batches

**⚠️ WARNING**: Never run all integration tests at once - they will timeout!

#### By Feature/Directory

```bash
# Client-related tests
npm run test:back-office:integration -- __tests__/api/client/

# Appointment-related tests
npm run test:back-office:integration -- __tests__/api/appointment/

# Analytics tests
npm run test:back-office:integration -- __tests__/api/analytics/

# Settings tests
npm run test:back-office:integration -- __tests__/(dashboard)/settings/
```

#### Single File

```bash
# Specific integration test
npx vitest run apps/back-office/__tests__/api/client/route.integration.test.ts

# With watch mode for development
npx vitest apps/back-office/__tests__/api/client/route.integration.test.ts
```

#### Pattern Matching

```bash
# All route integration tests
npm run test:back-office:integration -- route.integration

# All appointment-related integration tests
npm run test:back-office:integration -- appointment
```

### UI Tests

```bash
# All UI tests
npm run test:ui

# Specific app UI tests
npm run test:back-office:ui
npm run test:front-office:ui

# Specific UI test file
npx vitest run apps/back-office/__tests__/(dashboard)/clients/page.ui.test.tsx
```

## Environment Setup

### Using Docker (Recommended)

```bash
# Docker automatically starts test database on port 1434
npm run test:integration
```

### Without Docker (Direct Database)

1. Get DATABASE_URL from root `.env` file
2. Run tests with environment variable:

```bash
# Single test
DATABASE_URL="sqlserver://..." npx vitest run <test_file>

# Multiple tests in directory
DATABASE_URL="sqlserver://..." npm run test:back-office:integration -- __tests__/api/client/
```

### Required Environment Variables

For integration tests to pass, ensure these are set:

```bash
# Database (required)
DATABASE_URL="sqlserver://server:port;database=name;user=username;password=password;trustServerCertificate=true"

# Azure Storage (required for file upload tests)
AZURE_STORAGE_ACCOUNT_NAME="your_account"
AZURE_STORAGE_ACCOUNT_KEY="your_key"
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
AZURE_STORAGE_CONTAINER_NAME="uploads"

# Auth (required for protected routes)
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret"
```

## Common Issues and Solutions

### Issue: "Docker command not found"

**Solution**: Use direct database connection

```bash
DATABASE_URL="<from .env>" npx vitest run <test_file>
```

### Issue: "Test timeout exceeded"

**Solution**: Run smaller batches

```bash
# Instead of: npm test
# Do: npm run test:unit && npm run test:back-office:integration -- __tests__/api/client/
```

### Issue: "Database connection failed"

**Solution**: Check database is running and migrations applied

```bash
# Apply migrations
npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma

# Reset if needed
npx prisma migrate reset --schema=./packages/database/prisma/schema.prisma --force
```

### Issue: "Foreign key constraint error"

**Solution**: Use proper cleanup utilities

```typescript
import { cleanupDatabase } from "@mcw/database/test-utils";

afterAll(async () => {
  await cleanupDatabase(prisma);
});
```

### Issue: "Azure Storage errors in tests"

**Solution**: Add Azure credentials to `.env` or mock the storage

```typescript
// In test setup
vi.mock("@/utils/azureStorage");
```

## CI/CD Test Execution

### GitHub Actions Workflow

The CI pipeline runs tests in this order:

1. **Lint and TypeCheck** (parallel)
2. **Unit Tests** (all apps)
3. **Integration Tests** (batched by feature)

### Running CI Checks Locally

Simulate CI environment:

```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Run checks
npm run checks

# 3. Run tests in CI mode
npm run test:ci
```

### PR Verification Checklist

Before creating a PR, verify:

```bash
# 1. Code quality
npm run lint
npm run typecheck

# 2. Unit tests pass
npm run test:unit

# 3. Integration tests for changed features
# Example: If you changed client APIs
npm run test:back-office:integration -- __tests__/api/client/

# 4. Build succeeds
npm run build
```

## Best Practices

### 1. Test in Isolation

Run only the tests affected by your changes:

```bash
# Changed client component?
npx vitest run apps/back-office/__tests__/(dashboard)/clients/

# Changed appointment API?
npx vitest run apps/back-office/__tests__/api/appointment/
```

### 2. Use Watch Mode During Development

```bash
# Watch specific test file
npx vitest apps/back-office/__tests__/api/client/route.unit.test.ts

# Watch all tests in directory
npx vitest apps/back-office/__tests__/api/client/
```

### 3. Debug Failing Tests

```bash
# Run with more verbose output
npm run test:unit -- --reporter=verbose

# Run single test with full error output
npx vitest run <test_file> --reporter=verbose
```

### 4. Profile Slow Tests

```bash
# Find slow tests
npm run test:unit -- --reporter=verbose --slowTestThreshold=1000
```

## Test Organization

### Directory Structure

```
apps/back-office/
├── src/
│   └── app/
│       └── api/
│           └── client/
│               └── route.ts
└── __tests__/
    └── api/
        └── client/
            ├── route.unit.test.ts
            └── route.integration.test.ts
```

### Running Tests by Type

```bash
# All unit tests for client feature
find apps/back-office/__tests__ -name "*client*.unit.test.ts" -exec npx vitest run {} \;

# All integration tests for API routes
npm run test:back-office:integration -- __tests__/api/
```

## Summary

1. **Always run tests** - But be smart about batching
2. **Start with fast tests** - Lint → TypeCheck → Unit → Integration
3. **Run integration tests in batches** - By feature or directory
4. **Use proper cleanup** - Avoid foreign key errors
5. **Check environment** - Ensure all required variables are set

Remember: It's better to run tests in smaller batches frequently than to wait for all tests to complete in one large run that might timeout.
