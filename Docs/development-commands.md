# Development Commands

## Setup

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Update DATABASE_URL in .env.local

# Generate Prisma client and run migrations
npx prisma generate --schema=./packages/database/prisma/schema.prisma
npx prisma migrate dev
```

## Development

```bash
# Start all apps in development mode
npm run dev

# Start specific app
cd apps/back-office && npm run dev   # Port 3001
cd apps/front-office && npm run dev  # Port 3000

# Build all apps and packages
npm run build

# Type checking
npm run typecheck

# Lint and format
npm run lint
npm run format
npm run checks              # Run typecheck, prettier, and lint
```

## Database Operations

```bash
# Generate Prisma client (run from root)
npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Run migrations
npm run db:migrate          # Development migrations
npm run db:deploy           # Production migrations
npm run db:seed             # Seed database with initial data

# Database utilities
npm run db:generate         # Regenerate Prisma client
npx prisma studio --schema=./packages/database/prisma/schema.prisma  # Open Prisma Studio

# Reset database for integration tests (when schema issues occur)
npx prisma migrate reset --schema=./packages/database/prisma/schema.prisma --force
```

## Pre-commit Checks

The project uses Husky and lint-staged for:

- ESLint with auto-fix
- Prettier formatting
- Type checking
- Test validation

Always run `npm run checks` before committing to ensure all quality gates pass.
