# Testing Strategy

This document outlines the testing approach for the Next.js application with role management.

## Overview

The application uses Jest and React Testing Library for testing. The testing strategy includes:

1. **Unit Tests**: Testing individual components and functions in isolation
2. **Integration Tests**: Testing interactions between components and modules
3. **Authentication Tests**: Specifically testing authentication and role-based access

## Test Setup

### Database

- **SQLite In-Memory Database**: Used for all tests to ensure tests are fast and isolated
- Configuration in `.jest.setup.js`: Sets `DATABASE_URL="file::memory:?cache=shared"`

### Mock Setup

Key mocks include:

- **Prisma Client**: Mocked to avoid actual database operations during tests
- **NextAuth.js**: Mocked to simulate authentication without actual server calls
- **Next.js Router**: Mocked to test navigation without actual page transitions

## Test Files

The project includes the following test files:

1. **`__tests__/auth.test.ts`**: Tests authentication logic
2. **`__tests__/user-roles.test.ts`**: Tests role assignment and verification

## Running Tests

```bash
# Run all tests
npm test

# Run tests with watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run a specific test file
npm test -- user-roles.test.ts
```

## Test Data

Test fixtures include:

- **Admin user**: For testing admin-specific functionality
- **Clinician user**: For testing clinician-specific functionality
- **Roles**: ADMIN and CLINICIAN role records

## Coverage Targets

The project aims for the following test coverage:

- **Authentication**: 90%+
- **Role-based access**: 90%+
- **UI Components**: 80%+
- **Overall**: 80%+

## Continuous Integration

Tests are automatically run on:

1. **Pull Requests**: All tests must pass before merging
2. **Main Branch Commits**: Generates and stores coverage reports

## Best Practices

When writing tests:

1. Test component behavior, not implementation details
2. Use meaningful assertions that verify functionality
3. Keep tests independent and avoid test interdependencies
4. Use descriptive test and assertion names
5. Focus on critical paths and edge cases 