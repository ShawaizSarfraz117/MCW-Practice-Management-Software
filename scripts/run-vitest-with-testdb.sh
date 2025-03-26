#!/bin/bash
set -e

# Function to cleanup resources
cleanup() {
    echo "Cleaning up test environment..."
    docker compose -f docker-compose-test.yml down --remove-orphans
}

# Setup cleanup trap
trap cleanup EXIT

echo "Starting test database..."
docker compose -f docker-compose-test.yml up -d

echo "Waiting for database to be ready..."
until docker compose -f docker-compose-test.yml exec test-db /opt/mssql-tools18/bin/sqlcmd \
    -S test-db -U sa -P "YourStrongTestPassword123" \
    -Q "SELECT 1" \
    -b \
    -C \
    -N \
    -o /dev/null
do
    echo "Database not ready - waiting..."
    sleep 1
done


# Set environment variables for tests
export NODE_ENV=test
export DATABASE_URL="sqlserver://localhost:1434;database=mcw_test;user=sa;password=YourStrongTestPassword123;TrustServerCertificate=true"

echo "Running database migrations..."

npm run db:migrate

# forward the arguments to vitest
vitest $@

# Cleanup is handled by the trap 