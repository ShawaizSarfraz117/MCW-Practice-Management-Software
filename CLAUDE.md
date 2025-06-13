# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See @README for project overview and @package.json for available npm commands.

## CRITICAL INSTRUCTIONS - MUST NEVER BE IGNORED

**DISCUSSION AND COLLABORATION REQUIREMENTS**:

- When the user says "let's discuss", "let's talk", or "let's brainstorm" - STOP and have a conversation
- NEVER implement or create documents when discussion is requested
- ALWAYS present options and wait for user input
- When user says "after we agree" - explicit agreement is required before proceeding
- Ask clarifying questions instead of making assumptions
- Present ideas for feedback, don't just execute

**PRE-COMMIT VERIFICATION REQUIREMENTS**:

- **NEVER COMMIT IF ANY TEST OR CHECK IS FAILING** - This is a complete waste of time and breaks CI/CD
- **ALL means ALL**: Unit tests, UI tests, integration tests, linting, type checking, and formatting MUST ALL PASS
- **NO EXCEPTIONS**: If even ONE test fails, DO NOT COMMIT - fix it first
- **ALWAYS run pre-commit checks before committing**: `npm run check:enhanced:full`
- **CI will fail** if you commit with failing tests, causing delays and wasted time
- Pre-commit checks are MANDATORY to avoid time-consuming iteration cycles
- For quick iterations: `npm run check:enhanced` (without integration tests)
- For comprehensive checks: `npm run check:enhanced:full` (with integration tests)

**IMPORT CONVENTIONS - ENFORCED BY ESLINT**:

- **REQUIRED**: Use `@/` path aliases instead of relative imports with `../..` syntax
- For imports within the same app: Use `@/` (resolves to `src/`)
- For cross-package imports: Use `@mcw/package-name`
- ESLint will fail builds with `../..` imports

**ERROR HANDLING REQUIREMENTS**:

- **ALL API routes** must use `withErrorHandling` wrapper from `@mcw/utils`
- **ALL mutations** must use `showErrorToast(toast, error)` for error display
- Maximum error visibility in development environments

**TESTING REQUIREMENTS**:

- **Tests MUST be in `__tests__/` directory** (ESLint will error if in `src/`)
- **No feature is complete without tests**
- Naming: `.unit.test.ts` (mocked), `.integration.test.ts` (real DB), `.ui.test.tsx` (DOM)
- Use test helpers: `createRequest()` and `createRequestWithBody()` from `@mcw/utils`

## Project Overview

MCW Practice Management Software is a HIPAA-compliant healthcare practice management system built as a Turborepo-based monorepo with two main applications:

- **Back Office**: Admin/clinician dashboard (`apps/back-office/`) - runs on port 3001
- **Front Office**: Client-facing portal (`apps/front-office/`) - runs on port 3000

The project prioritizes **safety, security, and privacy** as it handles medical records. The codebase follows AI-first development principles where 95% of code is AI-generated while maintaining strict quality standards for security, privacy, and testing.

**API DEVELOPMENT PATTERNS**:

- All API routes must follow this structure in `src/app/api/[feature]/route.ts`:

```typescript
import { withErrorHandling } from "@mcw/utils";
import { prisma } from "@mcw/database";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Implementation
});
```

- Use `NextRequest` and `NextResponse`
- Validate all inputs before processing
- Use shared Prisma client with transactions when needed

## Reference Documentation (Load On-Demand)

When working on specific features or areas, load these references:

**Architecture & Development**:

- Architecture overview: @Docs/architecture.md
- Development setup: @Docs/development-commands.md
- Environment setup: @Docs/environment-setup.md

**Feature-Specific**:

- Appointment system: @Docs/appointment-tags.md
- API integration status: @Docs/API_INTEGRATION_ANALYSIS.md
- Business domain rules: @Docs/schema_notes.md
- Repository pattern proposal: @Docs/REPOSITORY_PATTERN_PROPOSAL.md

## Type Safety Rules

We follow a strict three-layer type hierarchy. Types flow DOWN, never UP:

1. **Prisma types** (`@mcw/database`) → API routes only
2. **Shared types** (`@mcw/types`) → All shared business types
3. **App types** (`apps/*/src/types/`) → UI-specific only

See @Docs/TYPE_SYSTEM_ARCHITECTURE.md for detailed rules and examples.

**Key Rules**:

- **ALWAYS use shared types from `@mcw/types` package** for all shared interfaces
- **Use Prisma types from `@mcw/database`** only when creating new shared types in `@mcw/types`
- **NEVER create duplicate type definitions** in individual components or pages
- **Follow naming conventions**: snake_case for API/DB, camelCase for UI

## Individual Developer Preferences

Add your personal preferences file:

- @~/.claude/mcw-preferences.md
