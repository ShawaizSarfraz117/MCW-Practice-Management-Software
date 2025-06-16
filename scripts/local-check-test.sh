#!/bin/bash

# Local Quick Check Script
# A faster version of pre-push checks for local development
# Allows selecting which checks to run

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_menu() {
    echo -e "${CYAN}$1${NC}"
}

# Function to check if a command succeeded
check_result() {
    if [ $? -eq 0 ]; then
        print_success "$1"
        return 0
    else
        print_error "$1"
        return 1
    fi
}

# Function to run TypeScript check
run_typecheck() {
    print_status "Running TypeScript type checking..."
    if npm run typecheck; then
        print_success "TypeScript type checking passed"
        return 0
    else
        print_error "TypeScript type checking failed"
        return 1
    fi
}

# Function to run lint
run_lint() {
    print_status "Running ESLint..."
    if npm run lint; then
        print_success "ESLint passed"
        return 0
    else
        print_error "ESLint failed"
        return 1
    fi
}

# Function to run prettier check
run_prettier() {
    print_status "Checking code formatting with Prettier..."
    if npm run format:check; then
        print_success "Prettier formatting check passed"
        return 0
    else
        print_error "Prettier formatting check failed"
        return 1
    fi
}

# Function to run all checks
run_all_checks() {
    print_status "Running all checks (typecheck, prettier, lint)..."
    if npm run checks; then
        print_success "All checks passed"
        return 0
    else
        print_error "Checks failed"
        return 1
    fi
}

# Function to run build
run_build() {
    print_status "Building the application..."
    if npm run build; then
        print_success "Build successful"
        return 0
    else
        print_error "Build failed"
        return 1
    fi
}

# Function to run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    if npm run test:unit; then
        print_success "Unit tests passed"
        return 0
    else
        print_error "Unit tests failed"
        return 1
    fi
}

# Function to run UI tests
run_ui_tests() {
    print_status "Running UI tests..."
    if npm run test:ui; then
        print_success "UI tests passed"
        return 0
    else
        print_error "UI tests failed"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests with local database..."
    
    # Read DATABASE_URL from .env file
    if [ -f ".env" ]; then
        export $(grep -E '^DATABASE_URL=' .env | xargs)
        if [ -z "$DATABASE_URL" ]; then
            print_warning "DATABASE_URL not found in .env file"
            return 1
        else
            print_status "Using database connection from .env"
            if DATABASE_URL="$DATABASE_URL" npm run test:integration; then
                print_success "Integration tests passed"
                return 0
            else
                print_error "Integration tests failed"
                return 1
            fi
        fi
    else
        print_warning ".env file not found"
        return 1
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "=================================================="
    echo "       MCW Local Check Tool"
    echo "=================================================="
    echo ""
    print_menu "Select what to check:"
    echo ""
    echo "  1) Quick checks (TypeScript + Lint) - ~30s"
    echo "  2) All checks (TypeScript + Lint + Prettier) - ~1min"
    echo "  3) Checks + Build - ~3min"
    echo "  4) Unit tests only - ~2min"
    echo "  5) UI tests only - ~2min"
    echo "  6) Integration tests only - ~5min"
    echo "  7) All tests (Unit + UI + Integration) - ~10min"
    echo "  8) Everything (Checks + Build + All tests) - ~15min"
    echo "  9) Custom selection"
    echo "  0) Exit"
    echo ""
}

# Custom selection menu
custom_selection() {
    local selections=()
    
    echo ""
    print_menu "Select checks to run (space to select, enter to confirm):"
    echo ""
    
    # Simple multi-select implementation
    options=("TypeScript Check" "ESLint" "Prettier" "Build" "Unit Tests" "UI Tests" "Integration Tests")
    selected=(0 0 0 0 0 0 0)
    
    for i in "${!options[@]}"; do
        echo "  $((i+1))) [ ] ${options[$i]}"
    done
    
    echo ""
    echo "Enter numbers separated by spaces (e.g., 1 2 4): "
    read -r input
    
    # Run selected checks
    for num in $input; do
        case $num in
            1) run_typecheck ;;
            2) run_lint ;;
            3) run_prettier ;;
            4) run_build ;;
            5) run_unit_tests ;;
            6) run_ui_tests ;;
            7) run_integration_tests ;;
        esac
    done
}

# Main script
START_TIME=$(date +%s)
failed_checks=0

# Check if running with arguments
if [ $# -gt 0 ]; then
    case "$1" in
        quick)
            run_typecheck || ((failed_checks++))
            run_lint || ((failed_checks++))
            ;;
        checks)
            run_all_checks || ((failed_checks++))
            ;;
        build)
            run_all_checks || ((failed_checks++))
            run_build || ((failed_checks++))
            ;;
        test)
            run_unit_tests || ((failed_checks++))
            run_ui_tests || ((failed_checks++))
            run_integration_tests || ((failed_checks++))
            ;;
        all)
            run_all_checks || ((failed_checks++))
            run_build || ((failed_checks++))
            run_unit_tests || ((failed_checks++))
            run_ui_tests || ((failed_checks++))
            run_integration_tests || ((failed_checks++))
            ;;
        *)
            echo "Usage: $0 [quick|checks|build|test|all]"
            exit 1
            ;;
    esac
else
    # Interactive mode
    while true; do
        show_menu
        read -p "Enter your choice: " choice
        
        case $choice in
            1) # Quick checks
                run_typecheck || ((failed_checks++))
                run_lint || ((failed_checks++))
                break
                ;;
            2) # All checks
                run_all_checks || ((failed_checks++))
                break
                ;;
            3) # Checks + Build
                run_all_checks || ((failed_checks++))
                run_build || ((failed_checks++))
                break
                ;;
            4) # Unit tests only
                run_unit_tests || ((failed_checks++))
                break
                ;;
            5) # UI tests only
                run_ui_tests || ((failed_checks++))
                break
                ;;
            6) # Integration tests only
                run_integration_tests || ((failed_checks++))
                break
                ;;
            7) # All tests
                run_unit_tests || ((failed_checks++))
                run_ui_tests || ((failed_checks++))
                run_integration_tests || ((failed_checks++))
                break
                ;;
            8) # Everything
                run_all_checks || ((failed_checks++))
                run_build || ((failed_checks++))
                run_unit_tests || ((failed_checks++))
                run_ui_tests || ((failed_checks++))
                run_integration_tests || ((failed_checks++))
                break
                ;;
            9) # Custom selection
                custom_selection
                break
                ;;
            0) # Exit
                echo "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please try again."
                ;;
        esac
    done
fi

# Calculate total time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "=================================================="
if [ $failed_checks -eq 0 ]; then
    print_success "All selected checks passed! 🎉"
else
    print_error "$failed_checks check(s) failed! ❌"
fi
echo "Total time: ${MINUTES}m ${SECONDS}s"
echo "=================================================="

exit $failed_checks