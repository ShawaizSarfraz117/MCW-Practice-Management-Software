# Environment Setup and Credentials

**IMPORTANT**: All required credentials for development and testing are stored in the root `.env` file.

## Database Connection

The project uses SQL Server database with credentials available in the root `.env` file:

```bash
# Check root .env file for DATABASE_URL value
# Format: sqlserver://server:port;database=name;user=username;password=password;trustServerCertificate=true
```

## Running Integration Tests Without Docker

When Docker is not available, use the database credentials directly from `.env`:

```bash
# Copy DATABASE_URL value from root .env file and use it like this:

# Single integration test
DATABASE_URL="<value_from_root_env_file>" npx vitest __tests__/api/client/route.integration.test.ts --run

# All back-office integration tests
DATABASE_URL="<value_from_root_env_file>" npx vitest --project back-office/integration --run

# All integration tests
DATABASE_URL="<value_from_root_env_file>" npx vitest .integration.test.ts --run
```

## Azure Storage Credentials

For blob storage and file upload functionality, the following credentials are needed in `.env`:

```bash
# Azure Storage (add these to .env when available)
AZURE_STORAGE_ACCOUNT_NAME="your_storage_account_name"
AZURE_STORAGE_ACCOUNT_KEY="your_storage_account_key"
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
AZURE_STORAGE_CONTAINER_NAME="uploads"
```

**Note**: These Azure Storage credentials are required for UI tests that involve file upload components to pass. Add them to the root `.env` file when available.

## Environment File Locations

1. **Primary**: `/mnt/e/repos/MCW-Practice-Management-Software/.env` (contains all credentials)
2. **Database specific**: `packages/database/prisma/.env` (references main .env)
3. **App specific**: `apps/back-office/.env.local` and `apps/front-office/.env.local` (optional overrides)

**Claude Code Memory Note**: Always use credentials from the root `.env` file for database connections and integration testing when Docker is not available.
