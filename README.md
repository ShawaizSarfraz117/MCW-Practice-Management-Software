# Next.js Application with Role Management

A modern Next.js application with user role management (Admin and Clinician), built with TypeScript, Prisma ORM, and NextAuth.js for authentication.

## Features

- **Authentication**: Secure login system using NextAuth.js
- **Role-based Authorization**: Different access levels for Admin and Clinician roles
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Database Integration**: Prisma ORM with SQLite for development/testing and SQL Server for production

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Authentication**: NextAuth.js
- **Database**: SQLite (development/testing), SQL Server (production)
- **Testing**: Jest and React Testing Library

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

### Test Credentials

For testing the application, you can use these pre-seeded accounts:

- **Admin User**
  - Email: admin@example.com
  - Password: admin123

- **Clinician User**
  - Email: clinician@example.com
  - Password: clinician123

## Project Structure

```
├── app/                   # Next.js application files
│   ├── (dashboard)/       # Dashboard routes (Admin/Clinician)
│   ├── (client)/          # Client portal routes
│   ├── api/               # API routes
│   ├── login/             # Login page
│   └── components/        # Shared components
├── prisma/                # Prisma schema and migrations
├── __tests__/             # Jest test files
├── public/                # Static assets
└── types/                 # TypeScript type definitions
```

## Database Schema

The application uses a role-based access control system with the following models:

- **User**: Core user data (email, password hash)
- **Role**: Available roles (ADMIN, CLINICIAN)
- **UserRole**: Junction table for many-to-many relationship between User and Role
