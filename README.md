# Development Process

We are developing a HIPAA-compliant application to store medical records. **Safety, security, and privacy are paramount**. If you notice anything in the project that could compromise these aspects, please notify us immediately.

## Our Approach

We leverage AI to generate high-quality production code with maximum efficiency. Our goal is for **95% of the code** to be AI-generated while maintaining strict quality standards. To achieve this, we:

- Enforce a strong testing culture with comprehensive integration tests
- Focus particularly on database interaction testing
- Select tools and frameworks that integrate seamlessly with AI-assisted development
- Use v0.dev to quickly convert Figma wireframes into production-ready code

## Features

- **Authentication**: Secure login system using NextAuth.js
- **Role-based Authorization**: Different access levels for BackOffice and FrontOffice roles
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Database Integration**: Prisma ORM with SQL Server for both development and production
- **Separate Hosting**: BackOffice and FrontOffice can be deployed on independent servers

## Tools and Frameworks

- **Framework**: Next.js (App Router) with TypeScript for scalability and performance
- **UI**: React with Tailwind CSS
- **Component Library**: ShadCN for streamlined UI development
- **AI Design-to-Code**: Figma + V0.dev for high-quality code generation
- **ORM**: Prisma for structured database access
- **Database**: MS SQL Server (both production and local development)
- **Backend**: Next.js API Routes
- **Authentication**: NextAuth.js for secure login and role-based access
- **Development**: Cursor.AI with actively maintained CursorRules to ensure high code quality
- **Testing**: Vitest with faker-js for efficient test data generation

## Development Flow

1. **Gather Requirements**: Utilize sketches, screenshots, and initial specifications
2. **Generate Figma Wireframes**: AI-assisted designs reviewed and annotated by business users
3. **Define Data Model**: ER diagram aligned through review with Figma screens and converted to a SQL-based Prisma schema
4. **Database Integration**:
   - **Production & Local Development**: MS SQL Server for cost efficiency, high availability, security, and point-in-time recovery
   - **Testing**: Comprehensive test coverage with both mock and integration tests
5. **Testing Strategy**:
   - No feature is finalized without proper test coverage
   - We leverage Cursor rules for testing and continuously improve these rules for efficiency
   - Both mock and integration tests are used to validate system behavior

## Why This Works

- AI accelerates development while ensuring high code quality
- Figma-driven ER modeling ensures database and UI alignment
- Clear separation between development, testing, and production environments
- Streamlined workflow allows for efficient collaboration between business and development teams

## Getting Started

### Prerequisites

- Node.js 22.14
- SQL Server (for both production and local development)

### SQL Server Setup

If you have SQL Server installed locally, you can use that. Otherwise, you can run SQL Server in Docker:

```bash
# Run SQL Server in Docker
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrongPassword123!" -p 1433:1433 --name sql-server -d mcr.microsoft.com/mssql/server:2022-latest

# Check container status
docker ps

# Stop SQL Server container
docker stop sql-server

# Start SQL Server container
docker start sql-server
```

### Environment Setup

1. Clone the repository
2. Copy .env.example to .env.local and configure your environment variables:

```bash
cp .env.example .env.local
```

3. Update the database connection string in .env.local:
   - For local development and production with SQL Server: `DATABASE_URL="sqlserver://localhost:1433;database=mcw;user=sa;password=YourStrongPassword123!;trustServerCertificate=true"`

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Run database migrations
npx prisma migrate dev
```

### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## Testing

### Testing Environment

The application uses two main testing approaches:

1. **Integration Tests**: Test the interaction between components and modules in a more realistic environment

- Use `UserPrismaFactory`, `ClinicianPrismaFactory` and other factories to create mock data for testing inside the database

2. **Mock Tests**: Use mock objects to isolate the unit being tested from its dependencies

- Use `UserFactory` and `ClinicianFactory` and other factories to create mock data for testing outside the database
- We use faker-js for generating realistic test data

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.ts
```

### Test Credentials

For testing the application, you can use these pre-seeded accounts:

- **BackOffice User**

  - Email: admin@example.com
  - Password: admin123

- **BackOffice User (previously Clinician)**
  - Email: clinician@example.com
  - Password: clinician123

## Project Structure

```
MCW/
├── apps/
│   ├── front-office/                        # Client-facing website
│   │   ├── public/                          # Static assets
│   │   ├── src/
│   │   │   ├── app/                         # App Router
│   │   │   │   ├── views                    # App views
│   │   │   │   ├── components               # App specific components
│   │   │   │   └── api/                     # API routes for client operations
│   │   │   └── __tests__/                   # Tests for front-office
│   │   │
│   │   ├── vitest.config.js                 # Vitest config for front-office
│   │   ├── next.config.js                   # Next.js configuration
│   │   ├── tsconfig.json                    # TypeScript config
│   │   └── package.json                     # Dependencies for front-office
│   │
│   └── back-office/                         # Admin/Therapist dashboard
│       ├── public/
│       ├── src/
│       │   ├── app/                         # App Router
│       │   │   ├── page.tsx
│       │   │   ├── layout.tsx
│       │   │   └── api/                     # API routes for admin operations
│       │   ├── styles/
│       │   └── __tests__/                   # Tests for back-office
│       │       ├── unit/
│       │       └── integration/
│       ├── vitest.config.js
│       ├── next.config.js
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── ui/                                  # Shared UI components
│   │   ├── src/
│   │   │   ├── components/                  # Reusable UI components
│   │   │   │   ├── Button/
│   │   │   │   ├── Card/
│   │   │   │   └── Form/
│   │   │   ├── hooks/                       # Shared React hooks
│   │   │   └── context/                     # Shared context providers
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── database/                            # Database access layer
│   │   ├── prisma/                          # Prisma configuration
│   │   │   ├── schema.prisma                # Database schema
│   │   │   ├── migrations/                  # Database migrations
│   │   │   └── seed.ts                      # Database seeding
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── utils/                               # Shared utilities
│   │   ├── src/
│   │   │   ├── formatting/
│   │   │   ├── validation/
│   │   │   └── helpers/
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── types/                               # Shared TypeScript types
│       ├── src/
│       │   ├── api.ts                       # API request/response types
│       │   ├── models.ts                    # Shared model types
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── turbo.json                               # Turborepo configuration
├── vitest.config.base.js                    # Base Vitest configuration
├── tsconfig.base.json                       # Base TypeScript configuration
├── package.json                             # Root package.json with workspaces
└── README.md                                # Project documentation
```

## Deployment

The application is designed to be deployed in two separate instances:

1. **BackOffice**: Admin interface for managing the application
2. **FrontOffice**: Client-facing interface

Each can be deployed to its own server with its own domain, allowing for better security and scalability.

## Database Schema

The application uses a role-based access control system with the following models:

- **User**: Core user data (email, password hash)
- **Role**: Available roles (ADMIN, CLINICIAN)
- **UserRole**: Junction table for many-to-many relationship between User and Role

## Logging

This application uses a unified logging system based on Pino for consistent log management across both applications.

1. **Basic Usage**:

```bash
import { logger } from '@mcw/logger';

// Simple logging
logger.info('Application started');
logger.error('Something went wrong');

// Structured logging
logger.info({ userId: '123', action: 'login' }, 'User logged in');
```

2. **Request Context (API Routes)**:

```bash
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@mcw/logger';

export async function GET(request: NextRequest) {
  // Create a logger with the request context
  const log = logger.fromRequest(request);

  log.info('Processing request');

  try {
    // Your API logic here
    return NextResponse.json({ success: true });
  } catch (error) {
    log.error(error, 'Request failed');
    return NextResponse.json({ error: 'Error occurred' }, { status: 500 });
  }
}
```

3. **Component-Specific Logging**:

```bash
import { logger } from '@mcw/logger';

// Create a component-specific logger
const componentLogger = logger.child({
  component: 'user-management',
});

// Use it in your component
componentLogger.info('Component initialized');
```

Logs are stored in the logs directory of each application as daily files (app-YYYY-MM-DD.log).

## Open Questions and Decisions

The following questions need to be addressed by the team:

1. **Authentication Strategy**:

   - Should we split backoffice and frontoffice into two separate apps, especially due their API as in the futures they probably will end up on separate servers. The remaining questions is code reuse

2. **Testing strategy**:
   - for what should we write integration tests, and for what should we write normal mocked tests. Where are our mocking boundaries (repository, services, interfaces?)
