# Testing Guidelines for MCW Practice Management Software

This document provides comprehensive guidelines for writing tests in the MCW Practice Management Software project.

## Table of Contents

- [Test Types](#test-types)
- [Factory Functions](#factory-functions)
- [Database Cleanup](#database-cleanup)
- [Common Patterns](#common-patterns)
- [Best Practices](#best-practices)
- [Anti-Patterns](#anti-patterns)

## Test Types

### Unit Tests (`.unit.test.ts`)

- Mock all external dependencies
- Use `prismaMock` from `@mcw/database/mock`
- Fast execution (< 2 seconds)
- Test business logic in isolation

### Integration Tests (`.integration.test.ts`)

- Use real database connections
- Test API endpoints end-to-end
- Use proper setup/teardown with cleanup utilities
- May be slower due to database operations

### UI Tests (`.ui.test.tsx`)

- Test React components
- Use when DOM environment is needed
- Automatically configured with happy-dom

## Factory Functions

The project uses auto-generated factory functions from `@mcw/database/mock-data`. These are generated using `@quramy/prisma-fabbrica`.

### Available Factories

For each Prisma model, two factory types are available:

1. **Plain object factories** - Create plain JavaScript objects
2. **Prisma factories** - Create database records

```typescript
import {
  UserFactory,
  UserPrismaFactory,
  ClinicianFactory,
  ClinicianPrismaFactory,
  AppointmentFactory,
  AppointmentPrismaFactory,
} from "@mcw/database/mock-data";

// Unit test - plain object
const mockUser = UserFactory.build({
  email: "test@example.com", // Override specific fields
});

// Integration test - database record
const user = await UserPrismaFactory.create({
  email: "test@example.com",
});

// Or use plain factory with prisma.create
const user2 = await prisma.user.create({
  data: UserFactory.build(),
});
```

### Factory Features

- **Automatic relationships**: Factories handle foreign keys automatically
- **Overrides**: Pass partial objects to override specific fields
- **Sequences**: Auto-incrementing values for unique fields
- **Build variants**: Use `.buildCreateInput()` for Prisma create inputs

## Database Cleanup

### Centralized Cleanup Utilities

Import from `@mcw/database/test-utils`:

```typescript
import {
  cleanupDatabase,
  cleanupTestUserData,
  safeCleanupDatabase,
} from "@mcw/database/test-utils";
```

### Integration Test Pattern

```typescript
describe("API Route Integration Test", () => {
  let testUser: User;

  beforeAll(async () => {
    // Create test data
    testUser = await UserPrismaFactory.create();
  });

  afterEach(async () => {
    // Clean specific tables modified in tests
    await prisma.appointment.deleteMany({});
    await prisma.appointmentTag.deleteMany({});
  });

  afterAll(async () => {
    // Full cleanup - handles foreign key constraints
    await cleanupDatabase(prisma, { verbose: false });
  });
});
```

### Cleanup Functions

1. **`cleanupDatabase(prisma, options)`**

   - Cleans all tables in correct order
   - Handles foreign key constraints
   - Options: `{ verbose: boolean }`

2. **`cleanupTestUserData(prisma, userId)`**

   - Targeted cleanup for specific user
   - Removes all related data

3. **`safeCleanupDatabase(prisma)`**
   - Includes environment checks
   - Prevents accidental production cleanup

## Common Patterns

### API Route Testing

```typescript
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { GET, POST } from "@/api/appointment/route";

// GET request
const request = createRequest({
  searchParams: { clientId: "123" },
});
const response = await GET(request);

// POST request
const body = AppointmentFactory.build();
const request = createRequestWithBody(body);
const response = await POST(request);
```

### Authentication in Tests

```typescript
import { mockSession } from "@mcw/utils/test-helpers";

// Mock authenticated request
const request = createRequest({
  headers: {
    authorization: "Bearer mock-token",
  },
});

// Or use session mocking
vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue(mockSession),
}));
```

### Testing with Transactions

```typescript
it("should handle concurrent updates", async () => {
  await prisma.$transaction(async (tx) => {
    const appointment = await AppointmentPrismaFactory.create();
    // Test logic within transaction
    // Automatically rolled back after test
  });
});
```

## Best Practices

### DO:

1. **Use existing factories** - Never create manual test objects
2. **Use cleanup utilities** - Don't write custom cleanup code
3. **Split large tests** - Keep test functions focused and small
4. **Test happy and error paths** - Include edge cases
5. **Use descriptive test names** - Should explain what and why
6. **Mock at appropriate boundaries** - Unit tests mock external calls
7. **Use proper assertions** - Check all relevant properties

### DON'T:

1. **Don't use `eslint-disable`** - Split tests instead
2. **Don't create test data manually** - Use factories
3. **Don't skip cleanup** - Always clean up after tests
4. **Don't test implementation details** - Test behavior
5. **Don't use arbitrary timeouts** - Fix root causes
6. **Don't duplicate test utilities** - Use shared helpers

## Anti-Patterns

### ❌ Manual Test Data Creation

```typescript
// BAD
const user = {
  id: "123",
  email: "test@example.com",
  password_hash: "...",
  // ... many more fields
};

// GOOD
const user = UserFactory.build();
```

### ❌ Custom Cleanup Code

```typescript
// BAD
afterEach(async () => {
  await prisma.$executeRaw`DELETE FROM appointments`;
  await prisma.$executeRaw`DELETE FROM users`;
});

// GOOD
afterEach(async () => {
  await cleanupDatabase(prisma);
});
```

### ❌ Large Test Functions

```typescript
// BAD
/* eslint-disable max-lines-per-function */
it("should test everything", async () => {
  // 200+ lines of test code
});

// GOOD
describe("Feature", () => {
  it("should handle success case", async () => {
    // Focused test
  });

  it("should handle error case", async () => {
    // Focused test
  });
});
```

## File Organization

Tests mirror the source structure:

```
src/app/api/appointment/route.ts
__tests__/api/appointment/route.unit.test.ts
__tests__/api/appointment/route.integration.test.ts
```

## Running Tests

```bash
# All tests
npm test

# Specific type
npm run test:unit
npm run test:integration
npm run test:ui

# Specific file
npx vitest path/to/test.unit.test.ts

# With coverage
npm run test:coverage
```

## Additional Resources

- Factory source: `/packages/database/src/__mocks__/data.ts`
- Cleanup utilities: `/packages/database/__tests__/utils/testCleanup.ts`
- Test helpers: `/packages/utils/src/test-helpers.ts`
- Prisma Fabbrica docs: https://github.com/Quramy/prisma-fabbrica
