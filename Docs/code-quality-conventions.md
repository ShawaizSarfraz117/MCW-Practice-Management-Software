# Code Quality and Conventions

## Code Quality Requirements

- **Type Safety**: Strict TypeScript, avoid `any`
- **Error Handling**: Comprehensive error handling with proper logging
- **Testing**: No feature complete without adequate test coverage
- **Security**: HIPAA compliance, no secrets in code
- **Consistency**: Follow existing patterns in codebase

## Security Principles

- HIPAA compliance is mandatory
- No sensitive data in logs
- Authentication required for all API routes (unless explicitly public)
- Role-based authorization checks
- Soft deletes preferred over hard deletes

## Development Workflow

1. Search existing codebase for similar implementations before writing new code
2. Use shared components from `packages/ui/` (add new ones via ShadCN if needed)
3. Follow established patterns for API routes, components, and utilities
4. Write tests (both unit and integration) for all new features
5. Run lint, typecheck, and tests before committing
6. Ensure HIPAA compliance and security best practices

## Important Guidelines

**From Cursor Rules**:

- Follow KISS & YAGNI principles
- Single responsibility for all functions
- Descriptive naming conventions
- Strict TypeScript (avoid `any`)
- Always use `catch (error: unknown)` pattern
- Mock boundaries at repository level for unit tests
- Integration tests use real database interactions

## Type Conversion

- Use utilities from `@mcw/utils` for case conversion between snake_case and camelCase
- Keep database/API layer in snake_case
- Keep UI/form layer in camelCase

## Component Development

- Use shared components from `packages/ui`
- Add missing ShadCN components via CLI: `npx shadcn-ui@latest add <component> --cwd ./packages/ui`
- Follow existing patterns in the codebase

## Import Conventions

- **REQUIRED**: Use `@/` path aliases instead of relative imports with `../..` syntax
- For imports within the same app: Use `@/` (resolves to `src/`)
- For cross-package imports: Use `@mcw/package-name`
- Get user approval before using relative imports with `../..` paths
- Examples:

  ```typescript
  // ✅ Preferred - use @ aliases
  import { Component } from "@/components/Component";
  import { utils } from "@/utils/helpers";
  import { prisma } from "@mcw/database";

  // ❌ Avoid - relative imports
  import { Component } from "../../../components/Component";
  import { utils } from "../../utils/helpers";
  ```

- Use Tailwind CSS for all styling

## Import Convention Enforcement

The project now automatically prevents `../..` relative imports via ESLint:

```bash
# This will fail linting with helpful error message
import { Component } from "../../components/Component";  # ❌

# This will pass
import { Component } from "@/components/Component";      # ✅
```

Error message: "Use @/ path aliases instead of relative imports with ../.. - see CLAUDE.md Import Conventions"
