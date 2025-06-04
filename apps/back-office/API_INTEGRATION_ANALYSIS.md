# MCW Practice Management Software - API Integration Analysis

## Overview

This document provides a comprehensive analysis of the API integration patterns used in the MCW Practice Management Software back-office application. The application follows modern Next.js 13+ App Router conventions with RESTful API design principles.

## Architecture Overview

### Technology Stack

- **Framework**: Next.js 13+ (App Router)
- **API Routes**: Located in `src/app/api/` directory
- **Database ORM**: Prisma
- **Authentication**: NextAuth.js
- **Logging**: Custom @mcw/logger package
- **Database**: Shared @mcw/database package

## API Route Structure

The API endpoints are organized by functional domains:

### Authentication & Authorization (`/api/auth`)

- **NextAuth Integration**: `/api/auth/[...nextauth]`
- **Session Management**: JWT-based with role-based access control
- **Role Types**: ADMIN, CLINICIAN, and other custom roles

### Core Business Entities

#### Client Management (`/api/client`)

- **CRUD Operations**: GET, POST, PUT, DELETE, PATCH
- **Nested Resources**:
  - `/api/client/contact` - Contact information
  - `/api/client/portal-permission` - Portal access settings
  - `/api/client/share-file` - File sharing capabilities
  - `/api/client/group` - Group management
  - `/api/client/group/billing-preference` - Group billing settings

#### Appointment Management (`/api/appointment`)

- **Features**:
  - Recurring appointments with complex patterns
  - Appointment limits per clinician
  - Status tracking and filtering
- **Dynamic Routes**: `/api/appointment/[id]`

#### Billing & Financial (`/api/billing-*`, `/api/invoice`)

- **Components**:
  - Billing documents
  - Billing addresses
  - Billing settings
  - Invoice management with payments
  - Statements and superbills

#### Clinical Operations (`/api/clinical*`, `/api/clinician`)

- **Clinician Management**: Individual and bulk operations
- **Service Associations**: `/api/clinician/services`
- **Clinical Information**: Practice-wide clinical data

## Common Design Patterns

### 1. HTTP Method Handlers

```typescript
// Standard pattern for API routes
export async function GET(request: NextRequest) {}
export async function POST(request: NextRequest) {}
export async function PUT(request: NextRequest) {}
export async function DELETE(request: NextRequest) {}
export async function PATCH(request: NextRequest) {}
```

### 2. Request Parameter Handling

```typescript
// Query parameters
const searchParams = request.nextUrl.searchParams;
const id = searchParams.get("id");

// Request body
const data = await request.json();
```

### 3. Database Operations

All database operations use Prisma with consistent patterns:

- `findUnique()` for single records
- `findMany()` with filtering and pagination
- `create()`, `update()`, `delete()` for mutations
- `$transaction()` for atomic operations

### 4. Error Handling

Standardized error responses:

```typescript
try {
  // Business logic
} catch (error) {
  logger.error(error);
  return NextResponse.json(
    { error: "Failed to perform operation" },
    { status: 500 },
  );
}
```

### 5. Response Patterns

```typescript
// Success
return NextResponse.json(data);
return NextResponse.json(data, { status: 201 }); // For creation

// Error
return NextResponse.json(
  { error: "Error message" },
  { status: 400 / 404 / 500 },
);
```

## Authentication & Authorization

### Session Management

- Uses NextAuth.js with JWT strategy
- Session includes user ID, email, roles, and role-based flags (isAdmin, isClinician)
- Helper function `getBackOfficeSession()` for consistent session retrieval

### Authorization Patterns

- Middleware-based route protection
- Role-based access control
- Clinician-specific data filtering using `getClinicianInfo()` helper

## Data Validation

### Input Validation

- Manual validation for required fields
- Type checking for complex objects
- Date parsing with error handling
- UUID validation for relationships

### Business Rule Validation

- Appointment limit checking
- Client group existence verification
- Relationship integrity checks

## Special Features

### 1. Recurring Appointments

- Complex recurring patterns (WEEKLY, MONTHLY, YEARLY)
- BYDAY support for weekly recurrence
- Series management (update/delete single, future, or all)

### 2. Audit Logging

- Comprehensive audit trail system
- Event types for all major entities
- HIPAA compliance flags
- User attribution for all actions

### 3. Multi-tenancy Support

- Clinician-based data isolation
- Practice-wide vs clinician-specific data access
- Client group management

### 4. File Management

- File upload capabilities (`/api/upload`)
- Azure Blob Storage integration (`/api/blobToSaas`)
- Document sharing with clients

## Performance Considerations

### Pagination

- Consistent pagination pattern across list endpoints
- Default limits to prevent large data transfers
- Skip/take pattern using Prisma

### Query Optimization

- Selective includes for related data
- Proper indexing strategies
- Transaction usage for complex operations

## Security Measures

### Authentication

- JWT-based authentication
- Secure session management
- Role-based access control

### Data Protection

- Input sanitization
- Parameterized queries via Prisma
- Proper error message handling (no sensitive data exposure)

### HIPAA Compliance

- Audit logging for sensitive operations
- Access control for client data
- Secure file handling

## Testing Infrastructure

Comprehensive test coverage:

- Unit tests for individual route handlers
- Integration tests for end-to-end flows
- UI tests for frontend components

## Best Practices Observed

1. **Consistent Error Handling**: All routes follow the same error handling pattern
2. **Logging**: Comprehensive logging using the custom logger package
3. **Type Safety**: TypeScript throughout with proper type definitions
4. **Modular Design**: Shared utilities and helpers
5. **Transaction Support**: Complex operations use database transactions
6. **Soft Deletes**: Some entities use soft delete patterns (is_active flags)

## Areas for Improvement

1. **Request Validation**: Consider implementing a centralized validation layer (e.g., Zod schemas)
2. **API Documentation**: Add OpenAPI/Swagger documentation
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Caching**: Add caching layer for frequently accessed data
5. **API Versioning**: Implement versioning strategy for future changes

## Conclusion

The MCW Practice Management Software demonstrates a well-structured API design with consistent patterns, proper error handling, and security considerations. The modular approach and clear separation of concerns make the codebase maintainable and extensible.
