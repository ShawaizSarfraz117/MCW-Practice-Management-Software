#!/bin/bash

# Pre-Push Check Script
# This script runs all the checks that are performed in the CI/CD pipeline
# to ensure code quality before pushing to the repository

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to check if a command succeeded
check_result() {
    if [ $? -eq 0 ]; then
        print_success "$1"
    else
        print_error "$1"
        exit 1
    fi
}

# Start time
START_TIME=$(date +%s)

echo "=================================================="
echo "       MCW Pre-Push Checks"
echo "=================================================="
echo ""

# 1. Check Node.js and npm versions
print_status "Checking Node.js and npm versions..."
node_version=$(node --version)
npm_version=$(npm --version)
print_success "Node.js: $node_version, npm: $npm_version"
echo ""

# 2. Install dependencies (if package-lock.json is newer than node_modules)
print_status "Checking dependencies..."
if [ "package-lock.json" -nt "node_modules" ]; then
    print_warning "package-lock.json is newer than node_modules, running npm ci..."
    npm ci --silent
    check_result "Dependencies installed"
else
    print_success "Dependencies are up to date"
fi
echo ""

# 3. Generate Prisma client
print_status "Generating Prisma client..."
npm run --workspace packages/database db:generate --silent
check_result "Prisma client generated"
echo ""

# 4. Run TypeScript type checking
print_status "Running TypeScript type checking..."
npm run typecheck
check_result "TypeScript type checking passed"
echo ""

# 5. Run Prettier formatting check
print_status "Checking code formatting with Prettier..."
npm run format:check
check_result "Prettier formatting check passed"
echo ""

# 6. Run ESLint
print_status "Running ESLint..."
npm run lint
check_result "ESLint passed"
echo ""

# 7. Build the application
print_status "Building the application..."
npm run build
check_result "Build successful"
echo ""

# 8. Run unit tests
print_status "Running unit tests..."
npm run test:unit
check_result "Unit tests passed"
echo ""

# 9. Run UI tests
print_status "Running UI tests..."
npm run test:ui
check_result "UI tests passed"
echo ""

# 10. Run integration tests (using local database from .env)
print_status "Running integration tests with local database..."

# Read DATABASE_URL from .env file
if [ -f ".env" ]; then
    export $(grep -E '^DATABASE_URL=' .env | xargs)
    if [ -z "$DATABASE_URL" ]; then
        print_warning "DATABASE_URL not found in .env file, skipping integration tests"
    else
        print_status "Using database connection from .env"
        # Run integration tests with the local database
        DATABASE_URL="$DATABASE_URL" npm run test:integration
        check_result "Integration tests passed"
    fi
else
    print_warning ".env file not found, skipping integration tests"
fi
echo ""

# Calculate total time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo "=================================================="
print_success "All pre-push checks passed! 🎉"
echo "Total time: ${MINUTES}m ${SECONDS}s"
echo "=================================================="
echo ""
echo "It's safe to push your changes!"
echo ""

# Optional: Ask if user wants to push now
read -p "Do you want to push your changes now? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push
fi