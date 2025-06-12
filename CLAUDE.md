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

- **ALWAYS run pre-commit checks before pushing**: `npm run check:enhanced:full`
- **ALL tests MUST pass** - CI will fail otherwise, causing delays
- See @Docs/verification-commands.md for detailed instructions
- Pre-commit checks are MANDATORY to avoid time-consuming iteration cycles

## Project Overview

MCW Practice Management Software is a HIPAA-compliant healthcare practice management system built as a Turborepo-based monorepo with two main applications:

- **Back Office**: Admin/clinician dashboard (`apps/back-office/`) - runs on port 3001
- **Front Office**: Client-facing portal (`apps/front-office/`) - runs on port 3000

The project prioritizes **safety, security, and privacy** as it handles medical records. The codebase follows AI-first development principles where 95% of code is AI-generated while maintaining strict quality standards for security, privacy, and testing.

## Architecture and Development

- @Docs/architecture.md
- @Docs/api-patterns.md
- @Docs/code-quality-conventions.md
- @Docs/TYPE_SYSTEM_ARCHITECTURE.md

## Development Commands

- @Docs/development-commands.md
- @Docs/verification-commands.md

## Environment and Testing

- @Docs/environment-setup.md
- @Docs/testing-guidelines.md
- @Docs/error-handling.md

## Domain-Specific Documentation

- @Docs/appointment-tags.md
- @Docs/API_INTEGRATION_ANALYSIS.md
- @Docs/REPOSITORY_PATTERN_PROPOSAL.md
- @Docs/schema_notes.md

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
