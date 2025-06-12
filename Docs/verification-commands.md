# Fast Verification Commands

For quick verification that changes haven't broken anything, use these commands in order of speed:

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
