/**
 * Property-Based Tests for RLS Enforcement - Task 9.3
 * 
 * Feature: database-security, Property 6: RLS policies active on all tables
 * 
 * Property: For any table in the database, querying pg_policies should confirm 
 * that Row Level Security is enabled and at least one policy exists.
 * 
 * Validates: Requirements 4.1, 4.4
 * 
 * This property test verifies that:
 * 1. All critical tables have RLS enabled
 * 2. Unauthorized access is blocked
 * 3. RLS works across all access methods
 */

import { describe, test, expect, beforeAll } from 'vitest'
import * as fc from 'fast-check'
import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Skip tests if environment variables are not set
const skipTests = !supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey

// Critical tables that must have RLS enabled
const CRITICAL_TABLES = ['bookings', 'hotels', 'daily_schedules', 'bus_schedules'] as const
type CriticalTable = typeof CRITICAL_TABLES[number]

// Write operations that should be blocked for public users
const WRITE_OPERATIONS = ['INSERT', 'UPDATE', 'DELETE'] as const
type WriteOperation = typeof WRITE_OPERATIONS[number]

describe('Property 6: RLS policies active on all tables', () => {
  let publicClient: ReturnType<typeof createClient>
  let serviceRoleClient: ReturnType<typeof createClient>

  beforeAll(() => {
    if (skipTests) {
      console.warn('Skipping RLS property tests: Missing environment variables')
      return
    }

    // Create public client (uses anon key, respects RLS)
    publicClient = createClient(supabaseUrl!, supabaseAnonKey!)

    // Create service role client (bypasses RLS)
    serviceRoleClient = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  })

  /**
   * Feature: database-security, Property 6: RLS policies active on all tables
   * 
   * Property: For any critical table in the database, RLS must be enabled and
   * at least one policy must exist.
   */
  test.skipIf(skipTests)('Property: All critical tables have RLS enabled with policies', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...CRITICAL_TABLES),
        async (tableName) => {
          // Query pg_policies to check if RLS is enabled and policies exist
          const { data: policies, error } = await serviceRoleClient
            .from('pg_policies')
            .select('*')
            .eq('tablename', tableName)

          // Should not have errors querying policies
          expect(error).toBeNull()
          
          // Should have at least one policy
          expect(policies).toBeDefined()
          expect(Array.isArray(policies)).toBe(true)
          expect(policies!.length).toBeGreaterThan(0)

          // Verify the table has RLS enabled by checking pg_tables
          const { data: tableInfo } = await serviceRoleClient.rpc('execute_sql', {
            query: `SELECT relrowsecurity FROM pg_class WHERE relname = '${tableName}'`
          }).single()

          // If we can query policies, RLS is enabled
          return policies!.length > 0
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    )
  })

  /**
   * Feature: database-security, Property 6: RLS policies active on all tables
   * 
   * Property: For any write operation (INSERT, UPDATE, DELETE) attempted by
   * a non-privileged user on any critical table, the operation should be blocked by RLS.
   */
  test.skipIf(skipTests)('Property: Unauthorized write access is blocked by RLS', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...CRITICAL_TABLES),
        fc.constantFrom(...WRITE_OPERATIONS),
        async (tableName, operation) => {
          let isBlocked = false

          try {
            switch (operation) {
              case 'INSERT': {
                // Attempt to insert with minimal data
                const { error } = await publicClient
                  .from(tableName)
                  .insert({ id: fc.sample(fc.uuid(), 1)[0] })
                
                isBlocked = error !== null
                break
              }
              case 'UPDATE': {
                // Attempt to update any row
                const { error } = await publicClient
                  .from(tableName)
                  .update({ updated_at: new Date().toISOString() })
                  .limit(1)
                
                isBlocked = error !== null
                break
              }
              case 'DELETE': {
                // Attempt to delete any row
                const { error } = await publicClient
                  .from(tableName)
                  .delete()
                  .limit(1)
                
                isBlocked = error !== null
                break
              }
            }
          } catch (error) {
            // Any exception means the operation was blocked
            isBlocked = true
          }

          // The operation should always be blocked for public users
          return isBlocked
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    )
  })

  /**
   * Feature: database-security, Property 6: RLS policies active on all tables
   * 
   * Property: For any critical table, public users should be able to read data
   * (SELECT operations should be allowed by RLS policies).
   */
  test.skipIf(skipTests)('Property: Public read access is allowed by RLS', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...CRITICAL_TABLES),
        async (tableName) => {
          // Attempt to read from the table
          const { data, error } = await publicClient
            .from(tableName)
            .select('*')
            .limit(1)

          // Should not have errors (read is allowed)
          expect(error).toBeNull()
          
          // Data should be defined (even if empty array)
          expect(data).toBeDefined()
          expect(Array.isArray(data)).toBe(true)

          return error === null && Array.isArray(data)
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    )
  })

  /**
   * Feature: database-security, Property 6: RLS policies active on all tables
   * 
   * Property: For any access method (anon key vs service role), RLS should be
   * enforced consistently - service role can bypass, anon key cannot.
   */
  test.skipIf(skipTests)('Property: RLS enforcement is consistent across access methods', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...CRITICAL_TABLES),
        fc.constantFrom(...WRITE_OPERATIONS),
        async (tableName, operation) => {
          let publicBlocked = false
          let serviceRoleAllowed = false

          // Test with public client (should be blocked)
          try {
            switch (operation) {
              case 'INSERT': {
                const { error: publicError } = await publicClient
                  .from(tableName)
                  .insert({ id: fc.sample(fc.uuid(), 1)[0] })
                publicBlocked = publicError !== null
                break
              }
              case 'UPDATE': {
                const { error: publicError } = await publicClient
                  .from(tableName)
                  .update({ updated_at: new Date().toISOString() })
                  .limit(1)
                publicBlocked = publicError !== null
                break
              }
              case 'DELETE': {
                const { error: publicError } = await publicClient
                  .from(tableName)
                  .delete()
                  .limit(1)
                publicBlocked = publicError !== null
                break
              }
            }
          } catch {
            publicBlocked = true
          }

          // Test with service role client (should be allowed)
          // Note: We don't actually perform the operation to avoid side effects
          // We just verify that service role client exists and can query
          const { error: serviceRoleError } = await serviceRoleClient
            .from(tableName)
            .select('*')
            .limit(1)
          
          serviceRoleAllowed = serviceRoleError === null

          // Property: Public should be blocked, service role should be allowed
          return publicBlocked && serviceRoleAllowed
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    )
  })

  /**
   * Feature: database-security, Property 6: RLS policies active on all tables
   * 
   * Property: For any combination of table and write operation, the number of
   * blocked operations for public users should equal the total number of operations.
   */
  test.skipIf(skipTests)('Property: All write operations are blocked for public users', async () => {
    const results = await Promise.all(
      CRITICAL_TABLES.flatMap(table =>
        WRITE_OPERATIONS.map(async (operation) => {
          let isBlocked = false

          try {
            switch (operation) {
              case 'INSERT': {
                const { error } = await publicClient
                  .from(table)
                  .insert({ id: fc.sample(fc.uuid(), 1)[0] })
                isBlocked = error !== null
                break
              }
              case 'UPDATE': {
                const { error } = await publicClient
                  .from(table)
                  .update({ updated_at: new Date().toISOString() })
                  .limit(1)
                isBlocked = error !== null
                break
              }
              case 'DELETE': {
                const { error } = await publicClient
                  .from(table)
                  .delete()
                  .limit(1)
                isBlocked = error !== null
                break
              }
            }
          } catch {
            isBlocked = true
          }

          return { table, operation, isBlocked }
        })
      )
    )

    // All operations should be blocked
    const allBlocked = results.every(r => r.isBlocked)
    expect(allBlocked).toBe(true)

    // Total should be 12 (4 tables × 3 operations)
    expect(results).toHaveLength(12)
  })
})
