# Development Process

We are developing a HIPAA-compliant application to store medical records—therefore, safety, security, and privacy are paramount. If you notice anything in the project that could impact these aspects, please let us know immediately.

## Our Approach

We leverage AI to generate top-quality production code with maximum speed. Our goal is for **95% of the code** to be AI-generated while maintaining strict quality standards. To achieve this, we enforce a strong testing culture with comprehensive integration tests, particularly for database interactions. We focus on selecting tools and frameworks that integrate seamlessly with AI-assisted development to optimize efficiency and reliability.

## Features

- **Authentication**: Secure login system using NextAuth.js
- **Role-based Authorization**: Different access levels for BackOffice and FrontOffice roles
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Database Integration**: Prisma ORM with SQLite for development/testing and SQL Server for production
- **Separate Hosting**: BackOffice and FrontOffice can be hosted on separate servers

## Tools and Frameworks

- **Framework**: Next.js for scalability and performance. Using v0.dev, we can quickly convert Figma-Wireframes to working, top-quality code.
- **Component Library**: ShadCN for streamlined UI development.
- **AI Design-to-Code**: Figma + V0.dev for high-quality code generation.
- **ORM**: Prisma for structured database access.
- **Database**: MS SQL Server in production, SQLite for local and test environments.
- **Cursor.AI**: Used for local development, with actively maintained CursorRules to ensure high code quality.
- **Authentication**: NextAuth.js for secure login and role-based access.

## Development Flow

1. **Gather Requirements**: Utilize sketches, screenshots, and initial specifications.
2. **Generate Figma Wireframes**: AI-assisted designs reviewed and annotated by business users.
3. **Define Data Model**: The **ER diagram** is aligned through review with Figma screens and then converted to a SQL-based Prisma schema.
4. **Database Integration**:
   - **Production & QA**: MS SQL Server for cost efficiency, high availability, high security, and point-in-time recovery on Azure.
   - **Development**: SQLite for quick local setup and faster iteration.
   - **Testing**: SQLite in-memory for accelerated integration tests.
5. **Automated Schema Conversion**:
   - The **SQL Server schema** is manually maintained.
   - A tool **automatically converts SQL Server schema to SQLite** for local development.
   - From the SQLite schema, we generate local database migrations.
6. **Testing Strategy**:
   - Integration tests validate database interactions.
   - SQLite in-memory is used to speed up integration tests on developer machines.

## Why This Works

- AI accelerates development while ensuring high code quality.
- Figma-driven ER modeling ensures database and UI alignment.
- Clear separation between development, testing, and production environments.
- Streamlined workflow allows for efficient collaboration between business and development teams.

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- SQL Server (for production) or SQLite (for development)

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local` and configure your environment variables:

```bash
cp .env.example .env.local
```

3. Update the database connection string in `.env.local`:
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

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.ts
```

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
