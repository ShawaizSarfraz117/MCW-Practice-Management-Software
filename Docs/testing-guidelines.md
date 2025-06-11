# Testing Guidelines

## Testing Strategy

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

### Test Database

Integration tests use a separate SQL Server instance via Docker:

- Runs on port 1434 (vs 1433 for development)
- Automatically started/stopped by `./scripts/run-vitest-with-testdb.sh`
- Database migrations applied automatically before tests

## Testing Commands

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
# See environment-setup.md for database connection details
# Run single test: DATABASE_URL="<connection_string_from_env>" npx vitest __tests__/api/availability/route.integration.test.ts --run
# Run all integration tests: DATABASE_URL="<connection_string_from_env>" npx vitest --config=apps/back-office/vitest.config.integration.ts --run
```

## Test Location and Naming Rules

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

## Testing Requirements

- No feature is complete without tests
- Keep test files under 600 lines
- Use `createRequest` and `createRequestWithBody` from `@mcw/utils`
- Always run tests until all pass (no failures or pending)
- Account for JSON serialization (Date → ISO string, Decimal → string)
