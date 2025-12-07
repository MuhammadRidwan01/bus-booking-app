# RLS Edge Function Tests - Task 9.2

## Overview

This document explains how to run the RLS (Row Level Security) tests that verify proper security configuration with Edge Functions.

## Test Coverage

The tests in `tests/rls-edge-functions.test.ts` verify:

1. **Service role key bypasses RLS** - Edge Functions can perform write operations (INSERT, UPDATE, DELETE)
2. **Public access is read-only** - Anon key can only SELECT, cannot INSERT/UPDATE/DELETE
3. **RLS policies are enforced** - Unauthorized write attempts are blocked with policy errors

## Requirements

These tests require the following environment variables to be set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Public anon key
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # Service role key (admin)
```

## Running the Tests

### Option 1: With Environment Variables Set

If you have a `.env.local` file with the required variables:

```bash
# Run all RLS tests
pnpm test tests/rls-edge-functions.test.ts

# Run with watch mode
pnpm test:watch tests/rls-edge-functions.test.ts
```

### Option 2: Without Environment Variables

If environment variables are not set, the tests will be skipped automatically:

```bash
pnpm test tests/rls-edge-functions.test.ts
# Output: "Skipping RLS tests: Missing environment variables"
```

This is expected behavior and allows the test suite to run in CI/CD environments where Supabase credentials may not be available.

## Test Behavior

### When Environment Variables Are Set

The tests will:

1. Create two Supabase clients:
   - **Public client** (uses anon key, respects RLS)
   - **Service role client** (uses service role key, bypasses RLS)

2. Perform actual database operations:
   - Insert test bookings
   - Attempt updates and deletes
   - Verify RLS blocks unauthorized operations
   - Clean up test data

3. Verify security properties:
   - Service role can perform all CRUD operations
   - Public client can only SELECT (read)
   - Public client cannot INSERT, UPDATE, or DELETE
   - Error messages indicate RLS policy violations

### When Environment Variables Are Missing

All functional tests are automatically skipped, and only the documentation test runs. This ensures:

- Tests don't fail in environments without Supabase access
- CI/CD pipelines can run without credentials
- Local development is flexible

## Test Data

The tests use:

- Existing hotels and schedules from the database
- Temporary test bookings with `TEST-` prefix in booking codes
- Automatic cleanup after each test

## Expected Results

### Successful Test Run

```
✓ RLS with Edge Functions - Task 9.2 (8)
  ✓ RLS behavior documented and verified
  ✓ Service role key bypasses RLS for write operations
  ✓ Public client cannot perform write operations (INSERT blocked)
  ✓ Public client cannot perform write operations (UPDATE blocked)
  ✓ Public client cannot perform write operations (DELETE blocked)
  ✓ Public client can read data (SELECT allowed)
  ✓ Public client can read schedules (SELECT allowed)
  ✓ Service role can perform all operations
```

### Skipped Test Run (No Environment Variables)

```
✓ RLS with Edge Functions - Task 9.2 (8 tests | 7 skipped)
  ✓ RLS behavior documented and verified
  ↓ Service role key bypasses RLS for write operations
  ↓ Public client cannot perform write operations (INSERT blocked)
  ↓ Public client cannot perform write operations (UPDATE blocked)
  ↓ Public client cannot perform write operations (DELETE blocked)
  ↓ Public client can read data (SELECT allowed)
  ↓ Public client can read schedules (SELECT allowed)
  ↓ Service role can perform all operations
```

## Troubleshooting

### Tests are skipped

**Cause:** Environment variables are not set.

**Solution:** Create a `.env.local` file with the required variables:

```bash
cp .env.example .env.local
# Edit .env.local and add your Supabase credentials
```

### Tests fail with "policy" or "permission denied" errors

**Cause:** This is expected behavior for public client tests. The tests verify that RLS is working correctly by attempting unauthorized operations.

**Solution:** Check that the error messages contain "policy", "permission", or "denied" - this indicates RLS is working as expected.

### Tests fail with "no test data available"

**Cause:** The database doesn't have any hotels or schedules.

**Solution:** Run the database migrations and seed data:

```bash
supabase db reset
```

## Security Notes

- **Never commit** `.env.local` with real credentials
- Service role key should only be used in secure environments (Edge Functions, tests)
- These tests verify that RLS prevents unauthorized access even when someone has the anon key
- The tests demonstrate the security model: public = read-only, service role = full access

## Related Files

- `tests/rls-edge-functions.test.ts` - Test implementation
- `tests/rls-audit.test.ts` - RLS policy audit (Task 9.1)
- `.kiro/specs/database-security/design.md` - Security design document
- `.kiro/specs/database-security/requirements.md` - Security requirements

## Requirements Validated

These tests validate:

- **Requirement 4.3:** Service role operations bypass RLS when needed
- **Requirement 4.4:** RLS policies are enforced for all access methods
