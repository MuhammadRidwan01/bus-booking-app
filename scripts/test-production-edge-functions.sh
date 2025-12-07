#!/bin/bash

# Production Edge Functions Test Script
# This script tests all Edge Functions in production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
JWT_TOKEN="${TEST_JWT_TOKEN:-}"
ADMIN_JWT_TOKEN="${TEST_ADMIN_JWT_TOKEN:-}"

# Counters
PASSED=0
FAILED=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo ""
}

print_test() {
    echo -n "Testing: $1... "
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

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    if [ -z "$PROJECT_REF" ]; then
        echo -e "${RED}Error: SUPABASE_PROJECT_REF environment variable not set${NC}"
        echo "Usage: SUPABASE_PROJECT_REF=your-project-ref ./scripts/test-production-edge-functions.sh"
        exit 1
    fi
    
    if [ -z "$JWT_TOKEN" ]; then
        echo -e "${YELLOW}Warning: TEST_JWT_TOKEN not set. Some tests will be skipped.${NC}"
    fi
    
    if [ -z "$ADMIN_JWT_TOKEN" ]; then
        echo -e "${YELLOW}Warning: TEST_ADMIN_JWT_TOKEN not set. Admin tests will be skipped.${NC}"
    fi
    
    echo -e "${GREEN}✓ Project Ref: $PROJECT_REF${NC}"
}

# Test 1: Booking function requires authentication
test_booking_requires_auth() {
    print_test "Booking function requires authentication"
    
    RESPONSE=$(curl -s -X POST \
        "https://${PROJECT_REF}.functions.supabase.co/booking" \
        -H "Content-Type: application/json" \
        -d '{"test": "data"}')
    
    if echo "$RESPONSE" | grep -q "Authentication required\|Unauthorized"; then
        print_pass
    else
        print_fail "Expected authentication error, got: $RESPONSE"
    fi
}

# Test 2: Booking function rejects invalid JWT
test_booking_rejects_invalid_jwt() {
    print_test "Booking function rejects invalid JWT"
    
    RESPONSE=$(curl -s -X POST \
        "https://${PROJECT_REF}.functions.supabase.co/booking" \
        -H "Authorization: Bearer invalid_token_12345" \
        -H "Content-Type: application/json" \
        -d '{"test": "data"}')
    
    if echo "$RESPONSE" | grep -q "Authentication required\|Unauthorized\|Invalid token"; then
        print_pass
    else
        print_fail "Expected authentication error, got: $RESPONSE"
    fi
}

# Test 3: Booking function with valid JWT (if token provided)
test_booking_with_valid_jwt() {
    if [ -z "$JWT_TOKEN" ]; then
        echo "Skipping: Booking with valid JWT (no token provided)"
        return
    fi
    
    print_test "Booking function with valid JWT"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        "https://${PROJECT_REF}.functions.supabase.co/booking" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "customerName": "Test User",
            "phoneNumber": "081234567890",
            "countryCode": "+62",
            "bookingDate": "2024-12-20",
            "scheduleId": "00000000-0000-0000-0000-000000000000",
            "passengerCount": 2,
            "roomNumber": "101",
            "idempotencyKey": "test-'$(date +%s)'",
            "hasWhatsapp": "yes"
        }')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    # Should get 400 (validation error) or 200 (success), not 401
    if [ "$HTTP_CODE" != "401" ] && [ "$HTTP_CODE" != "403" ]; then
        print_pass
    else
        print_fail "Expected non-auth error, got HTTP $HTTP_CODE: $BODY"
    fi
}

# Test 4: Admin booking requires authentication
test_admin_booking_requires_auth() {
    print_test "Admin booking requires authentication"
    
    RESPONSE=$(curl -s -X POST \
        "https://${PROJECT_REF}.functions.supabase.co/admin-booking" \
        -H "Content-Type: application/json" \
        -d '{"test": "data"}')
    
    if echo "$RESPONSE" | grep -q "Authentication required\|Unauthorized"; then
        print_pass
    else
        print_fail "Expected authentication error, got: $RESPONSE"
    fi
}

# Test 5: Admin booking with valid admin JWT (if token provided)
test_admin_booking_with_jwt() {
    if [ -z "$ADMIN_JWT_TOKEN" ]; then
        echo "Skipping: Admin booking with JWT (no admin token provided)"
        return
    fi
    
    print_test "Admin booking with admin JWT"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        "https://${PROJECT_REF}.functions.supabase.co/admin-booking" \
        -H "Authorization: Bearer $ADMIN_JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "hotelId": "00000000-0000-0000-0000-000000000000",
            "dailyScheduleId": "00000000-0000-0000-0000-000000000000",
            "customerName": "Admin Test",
            "phoneNumber": "081234567890",
            "passengerCount": 1,
            "roomNumber": "202"
        }')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    # Should get 400 (validation error) or 200 (success), not 401
    if [ "$HTTP_CODE" != "401" ]; then
        print_pass
    else
        print_fail "Expected non-auth error, got HTTP $HTTP_CODE: $BODY"
    fi
}

# Test 6: Booking status is publicly accessible
test_booking_status_public() {
    print_test "Booking status is publicly accessible"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        "https://${PROJECT_REF}.functions.supabase.co/booking-status?code=TEST123")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    # Should get 200 (even if booking not found)
    if [ "$HTTP_CODE" = "200" ]; then
        print_pass
    else
        print_fail "Expected HTTP 200, got $HTTP_CODE: $BODY"
    fi
}

# Test 7: Rate limiting on booking endpoint
test_booking_rate_limiting() {
    print_test "Rate limiting on booking endpoint"
    
    # Send 15 requests rapidly (limit is 10/minute)
    RATE_LIMITED=false
    for i in {1..15}; do
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
            "https://${PROJECT_REF}.functions.supabase.co/booking" \
            -H "Content-Type: application/json" \
            -d '{"test": "rate-limit"}')
        
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        
        if [ "$HTTP_CODE" = "429" ]; then
            RATE_LIMITED=true
            break
        fi
        
        sleep 0.1
    done
    
    if [ "$RATE_LIMITED" = true ]; then
        print_pass
    else
        print_fail "Expected 429 Too Many Requests, but rate limit not triggered"
    fi
}

# Test 8: Error messages are generic
test_generic_error_messages() {
    print_test "Error messages are generic (no stack traces)"
    
    RESPONSE=$(curl -s -X POST \
        "https://${PROJECT_REF}.functions.supabase.co/booking" \
        -H "Authorization: Bearer invalid_token" \
        -H "Content-Type: application/json" \
        -d '{"invalid": "data"}')
    
    # Check that response doesn't contain sensitive info
    if echo "$RESPONSE" | grep -qE "(stack|trace|\.ts:|\.js:|Error:.*at|file://|/home/|/usr/)"; then
        print_fail "Response contains stack trace or file paths: $RESPONSE"
    else
        print_pass
    fi
}

# Test 9: CORS headers are present
test_cors_headers() {
    print_test "CORS headers are present"
    
    HEADERS=$(curl -s -I -X OPTIONS \
        "https://${PROJECT_REF}.functions.supabase.co/booking")
    
    if echo "$HEADERS" | grep -qi "access-control-allow-origin"; then
        print_pass
    else
        print_fail "CORS headers not found in response"
    fi
}

# Test 10: Service role key not exposed
test_service_role_not_exposed() {
    print_test "Service role key not exposed in responses"
    
    RESPONSE=$(curl -s -X POST \
        "https://${PROJECT_REF}.functions.supabase.co/booking" \
        -H "Content-Type: application/json" \
        -d '{"test": "data"}')
    
    # Check for JWT pattern that might be service role key
    if echo "$RESPONSE" | grep -qE "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]{100,}"; then
        print_fail "Response may contain service role key or long JWT"
    else
        print_pass
    fi
}

# Main execution
main() {
    print_header "Production Edge Functions Test Suite"
    
    check_prerequisites
    
    print_header "Authentication Tests"
    test_booking_requires_auth
    test_booking_rejects_invalid_jwt
    test_booking_with_valid_jwt
    test_admin_booking_requires_auth
    test_admin_booking_with_jwt
    test_booking_status_public
    
    print_header "Security Tests"
    test_booking_rate_limiting
    test_generic_error_messages
    test_cors_headers
    test_service_role_not_exposed
    
    # Summary
    print_header "Test Summary"
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
        echo "Edge Functions are working correctly in production."
        exit 0
    else
        echo -e "${RED}✗ Some tests failed!${NC}"
        echo "Please review the failures and fix issues."
        exit 1
    fi
}

# Run main function
main
