# Repository Pattern Proposal

## Executive Summary

This document proposes introducing a Repository/Service layer to address current testing challenges and improve code organization. The primary goal is to enable transaction-based integration testing while providing a clean boundary for type conversions.

## Current Problems

### 1. Testing Challenges

- Integration tests require complex cleanup logic
- Tests can't run in parallel due to shared database state
- Data from one test can affect another
- Slow test execution due to cleanup overhead

### 2. Type Conversion Scattered

- Snake_case to camelCase conversion happens in multiple places
- No single source of truth for data access logic
- Difficult to maintain consistency

### 3. Direct Prisma Usage

- API routes directly use Prisma client
- Business logic mixed with database queries
- Hard to mock for unit tests

## Proposed Solution: Repository Pattern

### Core Concept

```typescript
// Repository handles:
// 1. All database operations
// 2. Type conversions (snake_case ↔ camelCase)
// 3. Transaction support for testing

export class UserRepository {
  constructor(private tx: Prisma.TransactionClient = prisma) {}

  async findById(id: string): Promise<UserUI | null> {
    const user = await this.tx.user.findUnique({ where: { id } });
    return user ? toUserUI(user) : null;
  }

  async update(id: string, data: Partial<UserUI>): Promise<UserUI> {
    const dbData = toUserUpdate(data); // camelCase → snake_case
    const updated = await this.tx.user.update({
      where: { id },
      data: dbData,
    });
    return toUserUI(updated); // snake_case → camelCase
  }
}
```

### Transaction-Based Testing

```typescript
describe("UserRepository", () => {
  it("should update user", async () => {
    await prisma
      .$transaction(async (tx) => {
        // Arrange
        const user = await tx.user.create({ data: testUserData });
        const repo = new UserRepository(tx);

        // Act
        const updated = await repo.update(user.id, { firstName: "New" });

        // Assert
        expect(updated.firstName).toBe("New");

        // AUTOMATIC ROLLBACK - No cleanup needed!
        throw new Error("Rollback");
      })
      .catch(() => {});
  });
});
```

## Benefits

### 1. Clean Testing

- **No cleanup code** - Transactions automatically rollback
- **Parallel execution** - Each test has isolated transaction
- **Fast tests** - No need to delete test data
- **Realistic testing** - Uses real database with real constraints

### 2. Type Safety

- **Single conversion point** - Repository handles all type conversions
- **Consistent API** - All repositories return UI types (camelCase)
- **Type-safe throughout** - No `any` or `unknown` types

### 3. Better Architecture

- **Separation of concerns** - Database logic separate from business logic
- **Testable** - Easy to mock repositories for unit tests
- **Maintainable** - Changes to database queries in one place
- **Reusable** - Same repository for API routes and background jobs

### 4. Performance

- **Parallel tests** - 5-10x faster test execution
- **No cleanup overhead** - Tests run faster
- **Optimized queries** - Centralized place for query optimization

## Expected Concerns and Responses

### "This adds unnecessary abstraction"

**Response**: The abstraction provides clear benefits:

- Centralized type conversion (solving our current snake_case/camelCase issue)
- Transaction-based testing (massive improvement over current approach)
- Single place for database logic (easier to optimize and maintain)

### "We already use Prisma, why add another layer?"

**Response**: Prisma is great for database access, but:

- It doesn't handle our type conversion needs
- Direct Prisma usage in routes makes testing difficult
- Repository pattern is a thin layer that solves real problems

### "This will slow down development"

**Response**: Actually speeds up development:

- No more writing cleanup code for tests
- Type conversions handled automatically
- Faster test execution means faster feedback
- Less debugging of test interference issues

### "It's over-engineering"

**Response**: It's solving specific problems we have:

- Current integration tests are fragile and slow
- Type conversions are scattered and inconsistent
- We need this for the type migration we're already doing

### "Why not just use service classes?"

**Response**: Repository pattern is more focused:

- Repositories handle data access only
- Services would handle business logic (can add later if needed)
- Keeps responsibilities clear and focused

## Implementation Plan

### Phase 1: Proof of Concept

1. Create `UserRepository` as example
2. Write transaction-based tests
3. Migrate 2-3 API routes to use repository
4. Measure test execution improvement

### Phase 2: Gradual Migration

1. Create repositories for core entities
2. Update API routes incrementally
3. No big-bang migration required

### Phase 3: Full Adoption

1. All new features use repositories
2. Migrate remaining routes as touched
3. Deprecate direct Prisma usage in routes

## Code Examples

### Before (Current Approach)

```typescript
// API Route - Mixed concerns
export async function PUT(request: NextRequest) {
  const body = await request.json();

  // Manual type conversion
  const updated = await prisma.user.update({
    where: { id: body.id },
    data: {
      first_name: body.firstName,
      last_name: body.lastName,
    }
  });

  // Manual conversion back
  return NextResponse.json({
    id: updated.id,
    firstName: updated.first_name,
    lastName: updated.last_name,
  });
}

// Test - Complex cleanup
it("should update user", async () => {
  // Arrange
  const user = await prisma.user.create({ data: testData });

  try {
    // Act
    const response = await PUT(createRequest({ ... }));

    // Assert
    expect(response.status).toBe(200);
  } finally {
    // Cleanup - hope this works!
    await prisma.user.delete({ where: { id: user.id } });
  }
});
```

### After (Repository Approach)

```typescript
// API Route - Clean and focused
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const repo = new UserRepository();

  const updated = await repo.update(body.id, body);
  return NextResponse.json(updated);
}

// Test - Transaction-based
it("should update user", async () => {
  await prisma
    .$transaction(async (tx) => {
      const user = await tx.user.create({ data: testData });
      const repo = new UserRepository(tx);

      const updated = await repo.update(user.id, { firstName: "New" });

      expect(updated.firstName).toBe("New");
      throw new Error("Rollback");
    })
    .catch(() => {});
});
```

## Alternative Approaches Considered

### 1. Service Layer Only

- Services typically include business logic
- We need a pure data access layer for type conversion
- Could add services on top of repositories later

### 2. Keep Current Approach

- Testing will remain slow and fragile
- Type conversions will stay scattered
- Test interference issues will persist

### 3. Mock Everything

- Loses confidence that code works with real database
- Doesn't solve type conversion problem
- More complex than transaction approach

## Conclusion

The Repository pattern solves our immediate problems:

1. **Testing**: Transaction-based tests with automatic rollback
2. **Types**: Centralized conversion between snake_case and camelCase
3. **Architecture**: Clear separation of concerns

This is not about following patterns blindly - it's about solving real problems we face daily. The investment will pay off immediately in faster, more reliable tests and cleaner code.

## Next Steps

1. Review this proposal with the team
2. Build proof of concept with `UserRepository`
3. Measure test execution time improvements
4. Make decision based on results

## References

- [Prisma Transaction API](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [Repository Pattern Benefits](https://martinfowler.com/eaaCatalog/repository.html)
- Our current [Type System Architecture](./TYPE_SYSTEM_ARCHITECTURE.md)
