# Architecture

## Monorepo Structure

- **apps/back-office**: Admin/clinician dashboard (Next.js 14 App Router) - port 3001
- **apps/front-office**: Client-facing portal (Next.js 14 App Router) - port 3000
- **packages/database**: Shared Prisma ORM schema with MS SQL Server
- **packages/ui**: Shared ShadCN-based UI components
- **packages/logger**: Centralized Pino-based logging with request context
- **packages/utils**: Shared utilities and helpers
- **packages/types**: Shared TypeScript types
- **Build System**: Turborepo for orchestrating builds and tasks

## Technology Stack

- **Framework**: Next.js 14 with App Router and TypeScript
- **UI**: React + Tailwind CSS + ShadCN UI components (`packages/ui/`)
- **Database**: MS SQL Server with Prisma ORM
- **Authentication**: NextAuth.js with role-based access control (ADMIN, CLINICIAN)
- **State Management**: TanStack Query for server state, React state for forms
- **Testing**: Vitest with comprehensive integration and unit testing
- **Logging**: Unified Pino-based logging system with request context and file rotation

## Key Patterns

- **API Routes**: Next.js Route Handlers in `src/app/api/` following feature-based grouping
- **Database Access**: Shared Prisma client from `@mcw/database` package
- **Component Reuse**: Shared UI components in `packages/ui/` using ShadCN patterns
- **Type Safety**: Strict TypeScript with shared types in `@mcw/types`
