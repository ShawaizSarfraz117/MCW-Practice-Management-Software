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
- **Database Integration**: Prisma ORM with SQLite for development/testing and SQL Server for production
- **Separate Hosting**: BackOffice and FrontOffice can be deployed on independent servers

## Tools and Frameworks

- **Framework**: Next.js (App Router) with TypeScript for scalability and performance
- **UI**: React with Tailwind CSS
- **Component Library**: ShadCN for streamlined UI development
- **AI Design-to-Code**: Figma + V0.dev for high-quality code generation
- **ORM**: Prisma for structured database access
- **Database**: MS SQL Server (production), SQLite (local/test environments)
- **Backend**: Next.js API Routes
- **Authentication**: NextAuth.js for secure login and role-based access
- **Development**: Cursor.AI with actively maintained CursorRules to ensure high code quality

## Development Flow

1. **Gather Requirements**: Utilize sketches, screenshots, and initial specifications
2. **Generate Figma Wireframes**: AI-assisted designs reviewed and annotated by business users
3. **Define Data Model**: ER diagram aligned through review with Figma screens and converted to a SQL-based Prisma schema
4. **Database Integration**:
   - **Production & QA**: MS SQL Server for cost efficiency, high availability, security, and point-in-time recovery on Azure
   - **Development**: SQLite for quick local setup and faster iteration
   - **Testing**: SQLite in-memory for accelerated integration tests
5. **Automated Schema Conversion**:
   - SQL Server schema is manually maintained
   - A tool automatically converts SQL Server schema to SQLite for local development
   - From the SQLite schema, we generate local database migrations
6. **Testing Strategy**:
   - Integration tests validate database interactions
   - SQLite in-memory is used to speed up integration tests on developer machines

## Why This Works

- AI accelerates development while ensuring high code quality
- Figma-driven ER modeling ensures database and UI alignment
- Clear separation between development, testing, and production environments
- Streamlined workflow allows for efficient collaboration between business and development teams

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- SQL Server (for production) or SQLite (for development)

### Environment Setup

1. Clone the repository
2. Copy .env.example to .env.local and configure your environment variables:

```bash
cp .env.example .env.local
```

3. Update the database connection string in .env.local:
   - For development with SQLite: `DATABASE_URL="file:./dev.db"`
   - For production with SQL Server: `DATABASE_URL="sqlserver://localhost:1433;database=mcw;user=sa;password=YourPassword;trustServerCertificate=true"`

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with initial data
npm run seed
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

The application is configured to use SQLite in-memory database for testing, providing fast and isolated test runs without affecting your development or production databases.

The application uses two main testing approaches:

1. **Integration Tests**: Test the interaction between components and modules in a more realistic environment
2. **Mock Tests**: Use mock objects to isolate the unit being tested from its dependencies

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
├── app/                   # Next.js application files
│   ├── (backoffice)/      # BackOffice routes
│   ├── (frontoffice)/     # FrontOffice routes
│   ├── api/               # API routes
│   │   ├── backoffice/    # BackOffice API routes
│   │   ├── frontoffice/   # FrontOffice API routes
│   │   └── auth/          # Authentication API routes
│   ├── (auth)/            # Authentication pages
│   └── components/        # Shared components
├── prisma/                # Prisma schema and migrations
├── __tests__/             # Jest test files
│   ├── integration/       # Integration tests
│   └── mocks/             # Mock tests
├── lib/                   # Shared utilities
├── public/                # Static assets
└── types/                 # TypeScript type definitions
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


## Open Questions and Decisions

The following questions need to be addressed by the team:

1. **Authentication Strategy**:
   - Should we split backoffice and frontoffice into two separate apps, especially due their API as in the futures they probably will end up on separate servers. The remaining questions is code reuse 

2. **Testing strategy**:
   - for what shold we write integration tests, and for what should we write , normal mocked tests. Where are our mocking boundries (repository, services, interfaces ?)