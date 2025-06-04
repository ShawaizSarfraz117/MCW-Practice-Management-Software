# API Improvements Action Plan

## Overview

Based on the comprehensive analysis of both API integration documents, this action plan provides specific, prioritized improvements to enhance the MCW Practice Management Software.

## Priority Matrix

| Priority      | Impact               | Effort      | Timeline  |
| ------------- | -------------------- | ----------- | --------- |
| P0 - Critical | Blocking features    | Low-Medium  | Immediate |
| P1 - High     | Major functionality  | Medium      | 1-2 weeks |
| P2 - Medium   | Quality improvements | Medium-High | 3-4 weeks |
| P3 - Low      | Nice-to-have         | Variable    | Future    |

## P0 - Critical Issues (Fix Immediately)

### 1. TypeScript Build Errors

**Issue**: TypeScript errors preventing build after schema changes
**Solution**:

```bash
# Run in order:
cd packages/database && npx prisma generate
cd ../../ && npm run build
```

**Owner**: DevOps Team
**Timeline**: Today

### 2. Missing Appointment Request API

**Issue**: Client portal cannot submit appointment requests
**Solution**: Create `/api/requests` endpoints with:

- GET /api/requests - List all requests
- POST /api/requests/[id]/approve - Approve request
- POST /api/requests/[id]/deny - Deny with reason

**Implementation**:

```typescript
// /api/requests/route.ts
export async function GET(request: NextRequest) {
  const requests = await prisma.appointmentRequest.findMany({
    where: { status: "PENDING" },
    include: { Client: true, Clinician: true, PracticeService: true },
  });
  return NextResponse.json(requests);
}

// /api/requests/[id]/approve/route.ts
export async function POST(request: NextRequest, { params }) {
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.appointmentRequest.update({
      where: { id: params.id },
      data: { status: "APPROVED" },
    });

    const appointment = await tx.appointment.create({
      data: {
        client_group_id: request.client_id,
        clinician_id: request.clinician_id,
        service_id: request.service_id,
        start_date: request.start_time,
        end_date: request.end_time,
        status: "SCHEDULED",
      },
    });

    return { request, appointment };
  });

  return NextResponse.json(result);
}
```

**Owner**: Backend Team
**Timeline**: 2-3 days

## P1 - High Priority (Next Sprint)

### 1. Activity Log Integration

**Current**: Using mock data despite API existing
**Fix**:

```typescript
// Update /activity/page.tsx
const { data: activities } = useSWR(`/api/activity?${searchParams}`, fetcher);

// Add IP tracking to all API routes
export async function middleware(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Add to audit log
  await createAuditLog({
    event_type: "API_CALL",
    event_text: `${request.method} ${request.nextUrl.pathname}`,
    user_id: session?.user?.id,
    ip_address: ip,
  });
}
```

### 2. Analytics API Implementation

**Missing**: Income and Outstanding Balances endpoints

**Income Report API**:

```typescript
// /api/analytics/income/route.ts
export async function GET(request: NextRequest) {
  const { startDate, endDate } = getDateParams(request);

  const invoices = await prisma.invoice.findMany({
    where: {
      created_at: { gte: startDate, lte: endDate },
    },
    include: {
      Appointment: {
        include: { Clinician: true },
      },
    },
  });

  const gross = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const avgClinicianCut = await getAverageClinicianPercentage();
  const net = gross * (1 - avgClinicianCut);

  return NextResponse.json({
    gross,
    net,
    clientPayments: calculateClientPayments(invoices),
    byDay: groupByDay(invoices),
  });
}
```

### 3. Validation Layer Implementation

**Use Zod for all API inputs**:

```typescript
// /utils/validation/schemas.ts
import { z } from "zod";

export const schemas = {
  client: {
    create: z.object({
      legalFirstName: z.string().min(1).max(100),
      legalLastName: z.string().min(1).max(100),
      dob: z.string().datetime().optional(),
      emails: z.array(EmailSchema).min(1),
    }),
  },
  appointment: {
    create: z.object({
      client_group_id: z.string().uuid(),
      clinician_id: z.string().uuid(),
      start_date: z.string().datetime(),
      end_date: z.string().datetime(),
      service_id: z.string().uuid(),
    }),
  },
};

// Middleware
export function validateRequest(schema: z.ZodSchema) {
  return async (request: NextRequest) => {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    request.validatedData = result.data;
  };
}
```

## P2 - Medium Priority (Next Month)

### 1. API Documentation with Swagger

```typescript
// Install dependencies
npm install @asteasolutions/zod-to-openapi swagger-ui-react

// Generate OpenAPI spec from Zod schemas
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

const registry = new OpenAPIRegistry();

registry.registerPath({
  method: 'get',
  path: '/api/clients',
  description: 'Get all clients',
  summary: 'List clients',
  request: {
    query: ClientQuerySchema
  },
  responses: {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: ClientListSchema
        }
      }
    }
  }
});
```

### 2. Rate Limiting Implementation

```typescript
// Using upstash/ratelimit
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "15 m"),
});

export async function rateLimitMiddleware(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      {
        error: "Too many requests",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": new Date(reset).toISOString(),
        },
      },
    );
  }
}
```

### 3. Caching Layer

```typescript
// Redis caching for expensive queries
import { redis } from "@/lib/redis";

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300, // 5 minutes default
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return cached as T;

  const fresh = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(fresh));

  return fresh;
}

// Usage in API route
export async function GET(request: NextRequest) {
  const data = await getCachedData(
    `analytics:income:${clinicianId}`,
    async () => {
      return await calculateIncomeReport(clinicianId);
    },
    600, // 10 minute cache
  );

  return NextResponse.json(data);
}
```

## P3 - Low Priority (Future)

### 1. WebSocket Support for Real-time Updates

- Appointment status changes
- New appointment requests
- Team member availability

### 2. GraphQL API Alternative

- For complex data fetching
- Reduce over-fetching
- Better mobile app support

### 3. API Versioning

```typescript
// Version in URL
/api/1v / clients / api / v2 / clients;

// Version in header
request.headers.get("API-Version");
```

## Implementation Checklist

### Week 1

- [ ] Fix TypeScript build errors
- [ ] Implement appointment request APIs
- [ ] Deploy and test critical fixes
- [ ] Begin activity log integration

### Week 2

- [ ] Complete analytics APIs
- [ ] Implement validation layer
- [ ] Add IP tracking
- [ ] Start API documentation

### Week 3-4

- [ ] Add rate limiting
- [ ] Implement caching
- [ ] Complete security audit
- [ ] Performance testing

### Ongoing

- [ ] Monitor API usage
- [ ] Track error rates
- [ ] Optimize slow queries
- [ ] Update documentation

## Success Metrics

1. **API Response Times**

   - P95 < 200ms for reads
   - P95 < 500ms for writes

2. **Error Rates**

   - < 0.1% 5xx errors
   - < 1% 4xx errors

3. **Security**

   - 0 unauthorized access attempts
   - 100% audit log coverage

4. **Development Velocity**
   - 50% reduction in API-related bugs
   - 2x faster feature development

## Team Assignments

| Team     | Responsibilities     | First Task              |
| -------- | -------------------- | ----------------------- |
| Backend  | API implementation   | Appointment requests    |
| Frontend | UI integration       | Activity log connection |
| DevOps   | Infrastructure       | Redis setup             |
| QA       | Testing & validation | API test suite          |

## Questions to Resolve

1. **Payment Processing**: Which provider (Stripe, Square, etc.)?
2. **SMS Provider**: Twilio, AWS SNS, or other?
3. **File Storage**: Continue with Azure or migrate to S3?
4. **Monitoring**: Datadog, New Relic, or custom solution?

## Next Steps

1. Review and approve this action plan
2. Assign team members to P0 items
3. Set up weekly API improvement meetings
4. Create tracking dashboard for progress

By following this action plan, we can systematically improve the API infrastructure while maintaining system stability and delivering value to users.
