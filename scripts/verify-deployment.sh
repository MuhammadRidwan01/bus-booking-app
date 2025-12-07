#!/bin/bash

# Deployment Verification Script
# This script verifies that all security measures are in place before and after deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo ""
}

print_check() {
    echo -n "Checking: $1... "
}

print_pass() {
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC}"
    echo -e "${RED}  $1${NC}"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING${NC}"
    echo -e "${YELLOW}  $1${NC}"
    ((WARNINGS++))
}

# Check 1: No migration files in git
check_no_migrations_in_git() {
    print_check "No migration files in git"
    
    # Check if any .sql files in migrations directory are tracked
    TRACKED_MIGRATIONS=$(git ls-files | grep "supabase/migrations/.*\.sql" || true)
    
    if [ -z "$TRACKED_MIGRATIONS" ]; then
        print_pass
    else
        print_fail "Found tracked migration files:\n$TRACKED_MIGRATIONS"
    fi
}

# Check 2: No Edge Function code in git
check_no_edge_functions_in_git() {
    print_check "No Edge Function implementations in git"
    
    # Check for tracked TypeScript files in function directories (except _shared)
    TRACKED_FUNCTIONS=$(git ls-files | grep "supabase/functions/[^_].*\.ts" || true)
    
    if [ -z "$TRACKED_FUNCTIONS" ]; then
        print_pass
    else
        print_fail "Found tracked Edge Function files:\n$TRACKED_FUNCTIONS"
    fi
}

# Check 3: No secrets in repository
check_no_secrets_in_repo() {
    print_check "No secrets in repository"
    
    # Search for common secret patterns
    SECRETS=$(git grep -E "(service_role|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+|sk_live_|pk_live_|SUPABASE_SERVICE_ROLE_KEY.*=.*ey)" -- ':!*.md' ':!scripts/*' || true)
    
    if [ -z "$SECRETS" ]; then
        print_pass
    else
        print_fail "Found potential secrets in repository:\n$SECRETS"
    fi
}

# Check 4: .gitignore is properly configured
check_gitignore() {
    print_check ".gitignore properly configured"
    
    MISSING_ENTRIES=""
    
    # Check for required entries
    if ! grep -q "supabase/functions/\*\*" .gitignore; then
        MISSING_ENTRIES="${MISSING_ENTRIES}\n  - supabase/functions/**"
    fi
    
    if ! grep -q "supabase/migrations/\*\*" .gitignore; then
        MISSING_ENTRIES="${MISSING_ENTRIES}\n  - supabase/migrations/**"
    fi
    
    if ! grep -q "types/supabase.ts" .gitignore; then
        MISSING_ENTRIES="${MISSING_ENTRIES}\n  - types/supabase.ts"
    fi
    
    if [ -z "$MISSING_ENTRIES" ]; then
        print_pass
    else
        print_fail "Missing .gitignore entries:$MISSING_ENTRIES"
    fi
}

# Check 5: No secrets in git history
check_no_secrets_in_history() {
    print_check "No secrets in git history"
    
    # This is a basic check - for thorough scanning use tools like truffleHog
    HISTORY_SECRETS=$(git log --all --source -S "service_role" --pretty=format:"%h %s" | head -5 || true)
    
    if [ -z "$HISTORY_SECRETS" ]; then
        print_pass
    else
        print_warning "Found 'service_role' mentions in git history. Review manually:\n$HISTORY_SECRETS"
    fi
}

# Check 6: Environment files are not tracked
check_env_files_not_tracked() {
    print_check "Environment files not tracked"
    
    TRACKED_ENV=$(git ls-files | grep "\.env$\|\.env\.local$\|\.env\.production$" || true)
    
    if [ -z "$TRACKED_ENV" ]; then
        print_pass
    else
        print_fail "Found tracked environment files:\n$TRACKED_ENV"
    fi
}

# Check 7: Production build configuration
check_production_build_config() {
    print_check "Production build configuration"
    
    if [ -f "next.config.mjs" ]; then
        # Check for source maps disabled
        if grep -q "productionBrowserSourceMaps.*false" next.config.mjs; then
            print_pass
        else
            print_warning "Source maps may not be disabled in production"
        fi
    else
        print_warning "next.config.mjs not found"
    fi
}

# Check 8: Minimal types in public repo
check_minimal_types() {
    print_check "Types are minimal (no DB internals)"
    
    if [ -f "types/index.ts" ]; then
        # Check for database-internal fields
        INTERNAL_FIELDS=$(grep -E "(created_at|updated_at|id:.*uuid|foreign.*key)" types/index.ts || true)
        
        if [ -z "$INTERNAL_FIELDS" ]; then
            print_pass
        else
            print_warning "Found potential database-internal fields in types:\n$INTERNAL_FIELDS"
        fi
    else
        print_warning "types/index.ts not found"
    fi
}

# Check 9: Edge Functions exist locally
check_edge_functions_exist() {
    print_check "Edge Functions exist locally"
    
    MISSING_FUNCTIONS=""
    
    if [ ! -f "supabase/functions/booking/index.ts" ]; then
        MISSING_FUNCTIONS="${MISSING_FUNCTIONS}\n  - booking/index.ts"
    fi
    
    if [ ! -f "supabase/functions/admin-booking/index.ts" ]; then
        MISSING_FUNCTIONS="${MISSING_FUNCTIONS}\n  - admin-booking/index.ts"
    fi
    
    if [ ! -f "supabase/functions/booking-status/index.ts" ]; then
        MISSING_FUNCTIONS="${MISSING_FUNCTIONS}\n  - booking-status/index.ts"
    fi
    
    if [ -z "$MISSING_FUNCTIONS" ]; then
        print_pass
    else
        print_fail "Missing Edge Functions:$MISSING_FUNCTIONS"
    fi
}

# Check 10: Shared utilities exist
check_shared_utilities() {
    print_check "Shared utilities exist"
    
    MISSING_UTILS=""
    
    if [ ! -f "supabase/functions/_shared/cors.ts" ]; then
        MISSING_UTILS="${MISSING_UTILS}\n  - cors.ts"
    fi
    
    if [ ! -f "supabase/functions/_shared/auth.ts" ]; then
        MISSING_UTILS="${MISSING_UTILS}\n  - auth.ts"
    fi
    
    if [ ! -f "supabase/functions/_shared/rate-limit.ts" ]; then
        MISSING_UTILS="${MISSING_UTILS}\n  - rate-limit.ts"
    fi
    
    if [ ! -f "supabase/functions/_shared/errors.ts" ]; then
        MISSING_UTILS="${MISSING_UTILS}\n  - errors.ts"
    fi
    
    if [ -z "$MISSING_UTILS" ]; then
        print_pass
    else
        print_fail "Missing shared utilities:$MISSING_UTILS"
    fi
}

# Check 11: LICENSE file exists and is restrictive
check_license() {
    print_check "Restrictive LICENSE file exists"
    
    if [ -f "LICENSE" ]; then
        if grep -qi "all rights reserved" LICENSE; then
            print_pass
        else
            print_warning "LICENSE may not be restrictive enough"
        fi
    else
        print_fail "LICENSE file not found"
    fi
}

# Check 12: Documentation exists
check_documentation() {
    print_check "Security documentation exists"
    
    MISSING_DOCS=""
    
    if [ ! -f "docs/edge-functions-setup.md" ]; then
        MISSING_DOCS="${MISSING_DOCS}\n  - edge-functions-setup.md"
    fi
    
    if [ ! -f "docs/DEPLOYMENT_GUIDE.md" ]; then
        MISSING_DOCS="${MISSING_DOCS}\n  - DEPLOYMENT_GUIDE.md"
    fi
    
    if [ -z "$MISSING_DOCS" ]; then
        print_pass
    else
        print_warning "Missing documentation:$MISSING_DOCS"
    fi
}

# Main execution
main() {
    print_header "Security Deployment Verification"
    
    echo "This script verifies that all security measures are in place."
    echo "Run this before deploying to production."
    echo ""
    
    # Run all checks
    print_header "Git Security Checks"
    check_no_migrations_in_git
    check_no_edge_functions_in_git
    check_no_secrets_in_repo
    check_gitignore
    check_no_secrets_in_history
    check_env_files_not_tracked
    
    print_header "Code Security Checks"
    check_production_build_config
    check_minimal_types
    check_license
    
    print_header "Edge Functions Checks"
    check_edge_functions_exist
    check_shared_utilities
    
    print_header "Documentation Checks"
    check_documentation
    
    # Summary
    print_header "Verification Summary"
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All critical checks passed!${NC}"
        echo "You can proceed with deployment."
        exit 0
    else
        echo -e "${RED}✗ Some checks failed!${NC}"
        echo "Please fix the issues before deploying."
        exit 1
    fi
}

# Run main function
main
