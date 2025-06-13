# Local Testing Guide

This guide explains how to use the local testing and pre-push check scripts to ensure code quality before pushing changes.

## Available Scripts

### 1. `npm run check:local` - Interactive Local Check Tool

An interactive script that allows you to choose which checks to run locally. Perfect for quick verification during development.

```bash
npm run check:local
```

**Menu Options:**

1. **Quick checks** (TypeScript + Lint) - ~30 seconds
2. **All checks** (TypeScript + Lint + Prettier) - ~1 minute
3. **Checks + Build** - ~3 minutes
4. **Unit tests only** - ~2 minutes
5. **UI tests only** - ~2 minutes
6. **Integration tests only** - ~5 minutes (uses local .env database)
7. **All tests** (Unit + UI + Integration) - ~10 minutes
8. **Everything** (Checks + Build + All tests) - ~15 minutes
9. **Custom selection** - Choose specific checks to run

**Command Line Usage:**

```bash
# Run quick checks only
npm run check:local quick

# Run all checks (typecheck, lint, prettier)
npm run check:local checks

# Run checks and build
npm run check:local build

# Run all tests
npm run check:local test

# Run everything
npm run check:local all
```

### 2. `npm run check:pre-push` - Comprehensive Pre-Push Checks

Runs all the checks that are performed in the CI/CD pipeline. Use this before pushing to ensure your changes will pass the automated checks.

```bash
npm run check:pre-push
```

**What it runs (in order):**

1. Dependency installation check
2. Prisma client generation
3. TypeScript type checking
4. Prettier formatting check
5. ESLint
6. Application build
7. Unit tests
8. UI tests
9. Integration tests (using DATABASE_URL from .env)

**Features:**

- Shows colored output with timestamps
- Calculates total execution time
- Asks if you want to push after successful checks
- Exits immediately on any failure

## Integration Test Database Configuration

Both scripts automatically read the `DATABASE_URL` from your `.env` file for integration tests. This allows you to run integration tests against your local database without Docker.

**Setup:**

1. Ensure your `.env` file contains a valid `DATABASE_URL`:

   ```
   DATABASE_URL="sqlserver://server:port;database=name;user=username;password=password;trustServerCertificate=true"
   ```

2. The scripts will automatically use this connection for integration tests

## Best Practices

### During Development

Use `npm run check:local` with specific options:

```bash
# After making TypeScript changes
npm run check:local quick

# Before committing
npm run check:local checks

# After major changes
npm run check:local build
```

### Before Pushing

Always run the full pre-push check:

```bash
npm run check:pre-push
```

### Quick Commands Reference

```bash
# Fastest checks (lint + typecheck)
npm run lint && npm run typecheck

# All checks (lint + typecheck + prettier)
npm run checks

# Just unit tests
npm run test:unit

# Just integration tests with local database
DATABASE_URL="$(grep DATABASE_URL .env | cut -d '=' -f2-)" npm run test:integration
```

## Troubleshooting

### Integration Tests Timeout

If integration tests timeout, use the direct database connection:

```bash
# Copy DATABASE_URL from .env and run directly
DATABASE_URL="your_connection_string" npm run test:integration
```

### Prettier Formatting Issues

If prettier check fails, fix formatting:

```bash
npm run prettier:write
```

### ESLint Issues

If ESLint fails, try auto-fix:

```bash
npm run lint -- --fix
```

### Build Failures

Clear build cache and retry:

```bash
rm -rf .turbo
npm run build
```

## Benefits

- **Catch issues early**: Find problems before they reach CI/CD
- **Save time**: No more waiting for CI/CD to fail
- **Consistent quality**: Same checks locally as in CI/CD
- **Flexible testing**: Choose what to test based on your changes
- **Database flexibility**: Use local database for integration tests
