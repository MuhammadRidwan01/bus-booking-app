# RLS Property-Based Tests

## Overview

This document describes the property-based tests for Row Level Security (RLS) enforcement implemented in `tests/rls-property.test.ts`.

**Task:** 9.3 Write property tests for RLS enforcement  
**Feature:** database-security  
**Property:** Property 6 - RLS policies active on all tables  
**Validates:** Requirements 4.1, 4.4

## Property-Based Testing Approach

These tests use **fast-check** to perform property-based testing with a minimum of 100 iterations per property, as specified in the design document.

### Properties Tested

#### Property 1: All critical tables have RLS enabled with policies
**For any** critical table in the database, RLS must be enabled and at least one policy must exist.

- Tests all 4 critical tables: `bookings`, `hotels`, `daily_schedules`, `bus_schedules`
- Verifies each table has at least one RLS policy
- Runs 100 iterations

#### Property 2: Unauthorized write access is blocked by RLS
**For any** write operation (INSERT, UPDATE, DELETE) attempted by a non-privileged user on any critical table, the operation should be blocked by RLS.

- Tests all combinations of tables × operations (4 × 3 = 12 combinations)
- Verifies public client cannot INSERT, UPDATE, or DELETE
- Runs 100 iterations

#### Property 3: Public read access is allowed by RLS
**For any** critical table, public users should be able to read data (SELECT operations should be allowed by RLS policies).

- Tests SELECT operations on all critical tables
- Verifies public client can read data
- Runs 100 iterations

#### Property 4: RLS enforcement is consistent across access methods
**For any** access method (anon key vs service role), RLS should be enforced consistently - service role can bypass, anon key cannot.

- Tests that public client is blocked for write operations
- Tests that service role client has access
- Verifies consistency across all tables and operations
- Runs 100 iterations

#### Property 5: All write operations are blocked for public users
**For any** combination of table and write operation, the number of blocked operations for public users should equal the total number of operations.

- Tests all 12 combinations (4 tables × 3 operations)
- Verifies 100% of write operations are blocked for public users

## Running the Tests

### Prerequisites

1. **Supabase Instance**: You need a running Supabase instance (local or remote)
2. **Environment Variables**: Set the following in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Local Development

```bash
# Start local Supabase
supabase start

# Set environment variables from local Supabase output
# Copy the API URL, anon key, and service_role key to .env.local

# Run the property tests
pnpm test tests/rls-property.test.ts
```

### Production Testing

```bash
# Set production environment variables in .env.local
# (Use production Supabase URL and keys)

# Run the property tests
pnpm test tests/rls-property.test.ts
```

### Test Behavior

- **With environment variables**: Tests run and verify RLS policies against the database
- **Without environment variables**: Tests are automatically skipped with a warning message

## Test Results Interpretation

### Success Criteria

All tests should pass, indicating:
- ✅ All critical tables have RLS enabled
- ✅ All critical tables have at least one RLS policy
- ✅ Public users cannot perform write operations (INSERT, UPDATE, DELETE)
- ✅ Public users can perform read operations (SELECT)
- ✅ Service role can bypass RLS when needed
- ✅ RLS enforcement is consistent across all access methods

### Failure Scenarios

If any test fails, it indicates a security vulnerability:

1. **"All critical tables have RLS enabled with policies" fails**
   - One or more tables are missing RLS policies
   - Action: Review and add missing RLS policies

2. **"Unauthorized write access is blocked by RLS" fails**
   - Public users can perform write operations
   - Action: Review RLS policies and ensure write operations are restricted

3. **"Public read access is allowed by RLS" fails**
   - Public users cannot read data
   - Action: Review RLS policies and ensure SELECT is allowed

4. **"RLS enforcement is consistent across access methods" fails**
   - RLS is not being enforced consistently
   - Action: Review client configurations and RLS policies

## Integration with Other Tests

These property-based tests complement:

- **`tests/rls-audit.test.ts`**: Documents the RLS audit results (Task 9.1)
- **`tests/rls-edge-functions.test.ts`**: Tests RLS with Edge Functions (Task 9.2)

Together, these tests provide comprehensive coverage of RLS security requirements.

## Design Document Reference

These tests implement the testing strategy defined in:
- **Design Document**: `.kiro/specs/database-security/design.md`
- **Section**: Testing Strategy → Property-Based Testing
- **Property**: Property 6 - RLS policies active on all tables
- **Requirements**: 4.1, 4.4

## Fast-Check Configuration

- **Library**: fast-check v4.4.0
- **Iterations**: 100 per property (as specified in design doc)
- **Arbitrary Generators**: 
  - `fc.constantFrom()` for table names and operations
  - `fc.uuid()` for generating test IDs

## Maintenance

When adding new tables to the system:

1. Add the table name to `CRITICAL_TABLES` constant
2. Ensure the table has RLS enabled
3. Ensure the table has appropriate RLS policies
4. Run the property tests to verify

When modifying RLS policies:

1. Run the property tests before and after changes
2. Verify all tests still pass
3. Update documentation if behavior changes
