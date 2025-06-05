# Type System Architecture

## Overview

This document outlines the type system architecture for the MCW Practice Management Software. It defines the strict type hierarchy and rules for type management across the monorepo.

## Type Hierarchy - Strict Layers Approach

We follow a strict three-layer type hierarchy:

### Layer 1: Prisma Database Types (`@mcw/database`)

- **Purpose**: Raw database types auto-generated from Prisma schema
- **Usage**: ONLY in API routes and database service files
- **Import**: `import { User, Clinician } from "@mcw/database"`
- **Characteristics**:
  - Snake_case field names (e.g., `first_name`, `created_at`)
  - Contains ALL database fields including sensitive ones (e.g., `password_hash`)
  - Auto-generated - never manually edit
- **Example**:
  ```typescript
  // Only use in API routes or services
  const user = await prisma.user.findUnique({ where: { id } });
  ```

### Layer 2: Shared Types (`@mcw/types`)

- **Purpose**: Safe, shared types for business logic used across apps
- **Usage**: Everywhere EXCEPT database layer
- **Import**: `import { SafeUser, ApiResponse } from "@mcw/types"`
- **Characteristics**:
  - Safe versions without sensitive fields
  - All types that could be used in multiple apps
  - Business logic interfaces
- **Example**:
  ```typescript
  // Safe to use in components
  import { SafeUserWithRelations } from "@mcw/types";
  const user: SafeUserWithRelations = await fetchUser();
  ```

### Layer 3: App-Specific Types (`apps/*/src/types/`)

- **Purpose**: Types specific to a single application's UI
- **Usage**: Only within that specific app
- **Import**: `import { DashboardState } from "@/types/dashboard"`
- **Characteristics**:
  - UI state types
  - Component-specific props
  - Never duplicate shared business types
- **Example**:
  ```typescript
  // Local UI state
  interface FilterState {
    searchTerm: string;
    dateRange: DateRange;
  }
  ```

## The Golden Rule

**"Types flow DOWN the hierarchy, never UP"**

- ✅ API route uses Prisma types to create Shared types
- ✅ Components use Shared types
- ❌ Components NEVER import Prisma types directly
- ❌ Shared types NEVER depend on App-specific types

## Naming Conventions

We follow ecosystem-standard naming conventions at each layer:

### Database/API Layer (snake_case)

- **Where**: Prisma schema, API request/response bodies
- **Why**: SQL and REST API conventions
- **Examples**: `first_name`, `last_name`, `created_at`, `user_id`

### Frontend/UI Layer (camelCase)

- **Where**: React components, forms, TypeScript interfaces
- **Why**: JavaScript/TypeScript conventions
- **Examples**: `firstName`, `lastName`, `createdAt`, `userId`

### Conversion Points

- **API → Frontend**: Convert snake_case to camelCase when receiving data
- **Frontend → API**: Convert camelCase to snake_case when sending data
- **Tools**: Use conversion utilities from `@mcw/utils` (to be created)

### Example:

```typescript
// API Response (snake_case)
{
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2024-01-01T00:00:00Z"
}

// Frontend Type (camelCase)
interface User {
  firstName: string;
  lastName: string;
  createdAt: Date;
}

// Conversion
const user = toCamelCase(apiResponse); // Utility from @mcw/utils
```

## Migration Strategy

We use a gradual migration approach with three tracking mechanisms:

### 1. @deprecated JSDoc Tags

Mark types that should be replaced:

```typescript
/**
 * @deprecated Use SafeUserWithRelations from @mcw/types instead
 * This type will be removed in the next major version
 */
interface TeamMember { ... }
```

### 2. TODO Comments with Tags

Add searchable migration todos:

```typescript
// TODO: [TYPE-MIGRATION] Remove duplicate - use PaginatedResponse from @mcw/types
// TODO: [TYPE-MIGRATION] Convert snake_case to camelCase using utils
```

### 3. ESLint Warnings

Configure warnings for deprecated imports (see eslint.config.js)

## Validation Strategy

### Co-location Principle

**"Validation lives with its type definition"**

### 1. Shared Types (@mcw/types)

```typescript
// @mcw/types/forms/user.ts
import { z } from "zod";

// Type definition
export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
}

// Validation schema - same file
export const userFormSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Invalid email"),
});

// Type inference from schema
export type UserFormInput = z.infer<typeof userFormSchema>;
```

### 2. App-Specific Types

```typescript
// apps/back-office/src/types/filters.ts
export interface DateFilterForm {
  startDate: Date;
  endDate: Date;
}

// Validation in same file
export const dateFilterSchema = z
  .object({
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
  });
```

### 3. No Validation for Prisma Types

- Prisma types are validated at the database level
- Only create validation for user-facing forms
- Validation uses camelCase (UI convention)

## Boundary Conversion Strategy

### Core Principles

1. **Use Prisma types directly** - Don't recreate database types
2. **Convert at API boundaries** - Keep snake_case in API, camelCase in UI
3. **Type-safe conversions** - No `unknown` types in conversion functions
4. **Single validation schema** - Only for UI/form validation needs

### Implementation Pattern

```typescript
// @mcw/types/entities/user.ts
import { User } from "@mcw/database"; // Use Prisma type directly
import { z } from "zod";

// 1. Create safe type by removing sensitive fields
export type SafeUser = Omit<User, "password_hash">;

// 2. Define UI type (camelCase)
export interface UserUI {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// 3. Create validation schema for forms (optional)
export const userFormSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Invalid email"),
});

// 4. Type-safe conversion functions
export function toUserUI(user: SafeUser): UserUI {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export function toUserUpdate(data: Partial<UserUI>): Partial<User> {
  const update: Partial<User> = {};

  if (data.firstName !== undefined) update.first_name = data.firstName;
  if (data.lastName !== undefined) update.last_name = data.lastName;
  if (data.email !== undefined) update.email = data.email;

  return update;
}
```

### API Route Pattern

```typescript
// API route - handles conversion at boundary
export async function GET() {
  const users = await prisma.user.findMany({
    // Prisma returns snake_case
  });

  // Convert to camelCase for frontend
  return NextResponse.json(users.map(toUserUI));
}

export async function PUT(request: NextRequest) {
  const body = await request.json(); // camelCase from frontend

  // Optional: validate if needed
  const validated = userFormSchema.parse(body);

  // Convert to snake_case for database
  const dbData = toUserUpdate(validated);

  const updated = await prisma.user.update({
    where: { id: body.id },
    data: dbData,
  });

  // Return camelCase to frontend
  return NextResponse.json(toUserUI(updated));
}
```

### Component Pattern

```typescript
// Components only see camelCase
interface Props {
  user: UserUI;  // Always camelCase in components
}

export function UserProfile({ user }: Props) {
  return (
    <div>
      <p>{user.firstName} {user.lastName}</p>
      <p>Joined: {user.createdAt.toLocaleDateString()}</p>
    </div>
  );
}
```

### Benefits

1. **No type duplication** - Reuse Prisma's generated types
2. **Clear boundaries** - API layer handles all conversion
3. **Type safety** - No `unknown` types, full IntelliSense
4. **Validation only where needed** - Forms, not database operations
5. **Consistent conventions** - snake_case for DB/API, camelCase for UI

## Identified Issues

### 1. Type Duplication

Several types are duplicated across locations:

```typescript
// DUPLICATE: PaginatedResponse<T>
// Found in both:
// - packages/types/src/team-members.ts
// - apps/back-office/src/types/entities/index.ts

// DUPLICATE: ApiResponse<T>
// Found in both:
// - packages/types/src/index.ts
// - apps/back-office/src/types/entities/index.ts

// DUPLICATE: LicenseInfo
// Found in both:
// - apps/back-office/src/types/entities/team-member.ts
// - apps/back-office/src/types/profile.ts
```

### 2. Naming Convention Inconsistencies

```typescript
// Database (snake_case)
interface User {
  first_name: string;
  last_name: string;
  created_at: DateTime;
}

// Frontend (camelCase)
interface UserForm {
  firstName: string;
  lastName: string;
  createdAt: Date;
}
```

### 3. Type Safety Violations

Components creating local types instead of using shared types:

```typescript
// BAD: Local type definition
interface TeamMember {
  id: string;
  email: string;
  // ...
}

// GOOD: Import from shared types
import { SafeUserWithRelations } from "@mcw/types";
```

## Recommended Type Hierarchy Rules

### 1. Type Source Priority

Follow this hierarchy when choosing where types should come from:

```
1. Prisma Types (Database Layer Only)
   ↓
2. @mcw/types (Shared Types)
   ↓
3. App-specific types (UI/Form types only)
```

### 2. Type Usage Rules

#### Rule 1: Database Types Stay in Database Layer

- **Use Prisma types** only in:
  - API route handlers
  - Database service files
  - When creating new shared types in `@mcw/types`
- **Never import Prisma types** directly in components

#### Rule 2: Always Use Shared Types for Cross-App Data

- **All data types** that could be used in both apps must be in `@mcw/types`
- **Import from `@mcw/types`** for:
  - User/Team member types
  - API response types
  - Any business entity types

#### Rule 3: App-Specific Types Are Only for UI

- **Create app-specific types** only for:
  - Form state interfaces
  - Component props that are truly unique to that app
  - UI-specific helper types

### 3. Type Creation Guidelines

#### Creating Safe Types from Prisma Models

```typescript
// In packages/types/src/user.ts
import type { User, Clinician, UserRole, Role } from "@mcw/database";

// Remove sensitive fields
export type SafeUser = Omit<User, "password_hash">;

// Add relations
export type SafeUserWithRelations = SafeUser & {
  UserRole: (UserRole & {
    Role: Role;
  })[];
  Clinician: Clinician | null;
};
```

#### Creating Form Types

```typescript
// In packages/types/src/forms/user.ts
export interface UserFormData {
  firstName: string; // Note: camelCase for forms
  lastName: string;
  email: string;
}

// Mapping type for API
export interface UserUpdateRequest {
  first_name: string; // Note: snake_case for API
  last_name: string;
  email: string;
}
```

### 4. Naming Conventions

#### Database Layer (Prisma)

- Use **snake_case** for all fields
- Matches SQL Server conventions

#### API Layer

- Request/Response bodies: **snake_case** (matches database)
- This allows direct passing to Prisma without transformation

#### UI Layer

- Form fields and component props: **camelCase**
- Standard JavaScript/React convention

#### Conversion Utils

Create utilities in `@mcw/utils` for converting between conventions:

```typescript
// packages/utils/src/caseConversion.ts
export function toSnakeCase<T>(obj: T): SnakeCaseObject<T>;
export function toCamelCase<T>(obj: T): CamelCaseObject<T>;
```

## Implementation TODOs

### Phase 1: Clean Up Duplicates

```typescript
// TODO: Remove these duplicate types from apps/back-office/src/types/entities/index.ts
// - PaginatedResponse<T> (use from @mcw/types)
// - ApiResponse<T> (use from @mcw/types)
```

### Phase 2: Consolidate Team Member Types

```typescript
// TODO: Update all team member type imports
// FROM: local interfaces or Prisma types
// TO: import { SafeUserWithRelations } from "@mcw/types";
```

### Phase 3: Fix Form Types

```typescript
// TODO: Create proper form types in @mcw/types/forms/
// - TeamMemberFormData
// - TeamMemberUpdateRequest
// With proper case conversion utilities
```

### Phase 4: Add Type Mapping Utilities

```typescript
// TODO: Create in @mcw/utils
// - Case conversion utilities
// - Type guards for runtime validation
// - Prisma to Safe type converters
```

## Team Member Type Standardization

### Current Issues with Team Member Types

1. **Multiple type definitions** for the same entity
2. **Inconsistent field naming** (firstName vs first_name)
3. **Direct Prisma type usage** in components
4. **Missing type safety** in form submissions

### Recommended Team Member Type Structure

```typescript
// packages/types/src/team-member.ts

// Core safe type (from database)
export type SafeTeamMember = SafeUserWithRelations;

// Form data type (for UI)
export interface TeamMemberFormData {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  // ... other camelCase fields
}

// API request type (for backend)
export interface TeamMemberUpdateRequest {
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
  // ... other snake_case fields
}

// Conversion functions
export function formDataToApiRequest(
  data: TeamMemberFormData,
): TeamMemberUpdateRequest;

export function apiResponseToFormData(data: SafeTeamMember): TeamMemberFormData;
```

## Best Practices Summary

1. **Check `@mcw/types` first** before creating any new type
2. **Never duplicate types** - if it exists in shared types, import it
3. **Keep Prisma types in the database layer** - create safe versions for UI
4. **Use consistent naming** - snake_case for API/DB, camelCase for UI
5. **Document type decisions** - add comments explaining why a type exists where it does

## Migration Checklist

- [ ] Remove duplicate type definitions
- [ ] Update all imports to use `@mcw/types`
- [ ] Create missing shared types in `@mcw/types`
- [ ] Add case conversion utilities
- [ ] Update team member components to use standardized types
- [ ] Add runtime type validation for API boundaries
- [ ] Update CLAUDE.md with these type rules

## References

- [Prisma Schema](../packages/database/prisma/schema.prisma)
- [Shared Types](../packages/types/src/)
- [CLAUDE.md Type Safety Rules](../CLAUDE.md#type-safety-rules)
