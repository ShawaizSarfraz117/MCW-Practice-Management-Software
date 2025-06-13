# Fast Verification Commands

For quick verification that changes haven't broken anything, use these commands in order of speed:

## 🚨 CRITICAL: Pre-Commit Checks (MUST RUN BEFORE EVERY PUSH)

**IMPORTANT**: Always run pre-commit checks before pushing to avoid costly CI failures and time-consuming iterations.

### Pre-Commit Check Commands

```bash
# WITHOUT integration tests (faster, ~90 seconds)
npm run check:enhanced

# WITH integration tests (comprehensive, ~3-5 minutes)
npm run check:enhanced:full
```

### When to Use Each Command

- **Use `npm run check:enhanced`** (without integration) for:

  - Quick iterations during development
  - Minor code changes (styling, imports, refactoring)
  - When you haven't touched database or API logic

- **Use `npm run check:enhanced:full`** (with integration) for:
  - Before pushing to remote repository
  - After modifying API endpoints
  - After changing database queries or schema
  - Before creating pull requests

### What Pre-Commit Checks Include

1. **TypeScript + Prettier + Lint** (via `npm run checks` - matches CI exactly)
2. **Unit Tests** (447+ tests, runs in parallel)
3. **UI Tests** (22+ tests, component rendering)
4. **Integration Tests** (311+ tests, runs sequentially to avoid DB conflicts)

### Understanding the HTML Report

The pre-commit check generates a detailed HTML report at:

```
./test-results/reports/pre-commit-report.html
```

This report shows:

- ❌ Failed tests with detailed error messages
- ⏱️ Performance metrics and slow tests
- 📊 Test counts and execution timeline
- ⚠️ All warnings and errors

**ALL TESTS MUST PASS** - The CI/CD pipeline will fail if any test fails, causing delays.

### Why This Matters

- **Saves Time**: Catch issues locally in 2-5 minutes vs 10+ minute CI cycles
- **Prevents Broken Builds**: CI runs the exact same checks
- **Maintains Code Quality**: Ensures consistent code standards
- **Reduces Iterations**: Fix issues before they reach the PR stage

## 1. Fastest – Linting (10–20 seconds)

```bash
npm run lint               # Full monorepo linting
npm run lint:back-office   # Back-office only (if available)
npm run lint:front-office  # Front-office only (if available)
```

**What it catches**: Import violations, code style issues, basic syntax errors

## 2. Fast – Type checking (30–60 seconds)

```bash
npm run typecheck          # Full monorepo TypeScript checking
```

**What it catches**: Type mismatches, missing imports, interface violations

## 3. Medium - Unit Tests (1-3 minutes)

```bash
npm run test:back-office:unit    # Back-office unit tests
npm run test:front-office:unit   # Front-office unit tests
npm test:unit                    # All unit tests
```

**What it catches**: Business logic errors, component behavior, mocked API responses

## 4. Slower - Integration Tests (3-10 minutes, requires Docker)

```bash
npm run test:back-office:integration    # Back-office with real database
npm run test:front-office:integration   # Front-office integration tests
npm test:integration                    # All integration tests
```

**What it catches**: Database schema issues, real API behavior, end-to-end workflows

## 5. Complete - All Checks (5-15 minutes)

```bash
npm run checks             # Lint + TypeCheck + Format check
npm test                   # All tests (unit + integration)
```

## Recommended Verification Strategy

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
