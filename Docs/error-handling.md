# Error Handling Guidelines

## Error Visibility for Development

- **Critical Rule**: All errors must trickle back to developers in ALL environments except production
- **Development, staging, and testing**: Show maximum error information to developers (full stack traces, detailed messages, context)
- **Production Only**: Handle errors differently for end users (sanitized messages)
- **Implementation**: Always include error details in responses for non-production environments
- **Rationale**: Maximum error visibility saves significant development time by providing immediate feedback

## Error Handling Implementation

The project uses a centralized error handling system that provides maximum visibility in development while protecting sensitive information in production.

### API Error Handling

All API routes should use the `withErrorHandling` wrapper:

```typescript
import { withErrorHandling } from "@mcw/utils";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Your route logic here
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Your route logic here
});
```

This wrapper automatically:

- **Catches uncaught exceptions** (500 errors)
- **Generates unique error IDs** in format: `ERR-YYYYMMDD-HHMMSS-XXXX`
- **Logs full error details** server-side with stack traces
- **Returns environment-appropriate responses**:
  - Development: Full error details with stack trace
  - Production: Sanitized message with issue ID only

### Frontend Error Display

Use the centralized `showErrorToast` function in all mutations:

```typescript
import { showErrorToast } from "@mcw/utils";
import { toast } from "@mcw/ui";

const mutation = useMutation({
  mutationFn: myApiCall,
  onError: (error: unknown) => {
    showErrorToast(toast, error);
  },
});
```

This automatically:

- **Displays user-friendly error messages** in toasts
- **Shows issue IDs** for tracking (in case of 500 errors)
- **Logs full error details** to browser console in development
- **Makes toast text selectable** for easy copying

### Error Response Formats

**Business Logic Errors (400, 401, 403, 404):**

```json
{
  "error": "Clear business error message"
}
// or
{
  "error": {
    "message": "Clear business error message",
    "details": "Additional context if needed"
  }
}
```

**Server Errors (500) - Development:**

```json
{
  "error": {
    "message": "Error message",
    "stack": "Full stack trace...",
    "issueId": "ERR-20250106-143052-X7K9",
    "timestamp": "2025-01-06T14:30:52.000Z"
  }
}
```

**Server Errors (500) - Production:**

```json
{
  "error": {
    "message": "An error occurred while processing your request",
    "issueId": "ERR-20250106-143052-X7K9"
  }
}
```

### Key Benefits

1. **Consistent error handling** across all API routes
2. **Maximum visibility** for developers in non-production
3. **Secure error messages** in production
4. **Trackable errors** via unique issue IDs
5. **Selectable/copyable** error text in toasts
6. **Automatic logging** with proper context
