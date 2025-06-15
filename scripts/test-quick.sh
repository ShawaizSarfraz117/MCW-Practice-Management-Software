#!/bin/bash

# Quick Test Runner Script
# This script helps run tests efficiently without timeouts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get DATABASE_URL from .env
DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d '"' -f 2)

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not found in .env file${NC}"
    exit 1
fi

echo -e "${BLUE}MCW Test Runner - Quick & Efficient${NC}"
echo "====================================="
echo ""

# Function to run tests
run_test() {
    local test_name=$1
    local command=$2
    
    echo -e "${YELLOW}Running $test_name...${NC}"
    eval $command
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $test_name passed${NC}"
    else
        echo -e "${RED}✗ $test_name failed${NC}"
        echo -e "${YELLOW}Fix the issues above before proceeding${NC}"
        exit 1
    fi
    echo ""
}

# Main menu
if [ $# -eq 0 ]; then
    echo "What would you like to test?"
    echo ""
    echo "1) Quick Checks (lint + typecheck) - 1 min"
    echo "2) All Unit Tests - 2-3 min"
    echo "3) Client API Integration Tests"
    echo "4) Appointment API Integration Tests"
    echo "5) Service API Integration Tests"
    echo "6) Full Test Suite (lint + typecheck + unit)"
    echo "7) Custom Integration Test (provide path)"
    echo ""
    read -p "Select option (1-7): " choice
else
    choice=$1
fi

case $choice in
    1)
        run_test "Linting" "npm run lint"
        run_test "Type Checking" "npm run typecheck"
        ;;
    2)
        run_test "Unit Tests" "npm run test:unit"
        ;;
    3)
        run_test "Client API Integration" "DATABASE_URL=\"$DATABASE_URL\" npx vitest run apps/back-office/__tests__/api/client/route.integration.test.ts"
        ;;
    4)
        run_test "Appointment API Integration" "DATABASE_URL=\"$DATABASE_URL\" npx vitest run apps/back-office/__tests__/api/appointment/"
        ;;
    5)
        run_test "Service API Integration" "DATABASE_URL=\"$DATABASE_URL\" npx vitest run apps/back-office/__tests__/api/service/route.integration.test.ts"
        ;;
    6)
        run_test "Linting" "npm run lint"
        run_test "Type Checking" "npm run typecheck"
        run_test "Unit Tests" "npm run test:unit"
        ;;
    7)
        read -p "Enter test file path: " test_path
        run_test "Custom Integration Test" "DATABASE_URL=\"$DATABASE_URL\" npx vitest run $test_path"
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}All selected tests completed!${NC}"