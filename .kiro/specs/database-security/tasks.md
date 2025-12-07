# Implementation Plan

- [x] 1. Setup Git security and repository protection






- [x] 1.1 Update .gitignore to exclude sensitive files

  - Add supabase/functions/** exclusion
  - Add supabase/migrations/** exclusion
  - Add generated type files exclusion
  - Ensure all .env* files are ignored
  - _Requirements: 1.1, 1.2, 1.3, 1.4_



- [x] 1.2 Create restrictive LICENSE file

  - Write LICENSE with "All Rights Reserved" terms
  - Include prohibition of unauthorized commercial use
  - Add clear usage restrictions

  - _Requirements: 7.1, 7.3, 7.4_

- [x] 1.3 Remove sensitive files from git history

  - Check if migrations are currently tracked
  - If tracked, remove from git history using git filter-branch or BFG
  - Verify no secrets in git history
  - _Requirements: 1.1, 1.2, 3.3_

- [x] 1.4 Write unit tests for git security configuration


  - Test that .gitignore excludes Edge Functions directory
  - Test that no migration files are in git ls-files output
  - Test that no secrets match patterns in tracked files
  - **Property 1: Repository contains no migration files**
  - **Property 2: Edge Function code is never committed**
  - **Property 3: No secrets in repository**
  - **Validates: Requirements 1.1, 1.2, 1.3, 3.3**

- [x] 2. Create minimal public types for frontend




- [x] 2.1 Refactor types/index.ts to minimal interfaces


  - Create BookingFormData interface (input only)
  - Create BookingConfirmation interface (output only)
  - Create ScheduleDisplay interface (UI only)
  - Remove database-internal fields (id, created_at, foreign keys)
  - _Requirements: 9.1, 9.3, 9.4_



- [x] 2.2 Update .gitignore for generated types



  - Add types/supabase.ts to gitignore
  - Add types/database.ts to gitignore


  - _Requirements: 9.2_

- [x] 2.3 Write unit tests for type security





  - Test that public types don't contain database internals
  - Test that generated types are gitignored
  - Scan types for sensitive field names
  - **Property 10: Types do not expose full schema**
  - **Validates: Requirements 9.1, 9.3, 9.4**

- [x] 3. Setup Supabase Edge Functions infrastructure






- [x] 3.1 Create Edge Functions directory structure

  - Create supabase/functions/booking directory
  - Create supabase/functions/admin-booking directory
  - Create supabase/functions/booking-status directory
  - Add .gitkeep files to maintain structure
  - _Requirements: 2.4_

- [x] 3.2 Create shared utilities for Edge Functions


  - Create supabase/functions/_shared/cors.ts for CORS headers
  - Create supabase/functions/_shared/auth.ts for JWT validation
  - Create supabase/functions/_shared/rate-limit.ts for rate limiting
  - Create supabase/functions/_shared/errors.ts for error handling
  - _Requirements: 2.2, 11.1, 11.2, 11.3_



- [x] 3.3 Setup local development environment





  - Create .env.local.example with required secrets
  - Document how to set up local Supabase
  - Document how to serve Edge Functions locally
  - _Requirements: 5.1, 5.2_

- [x] 4. Implement Booking Edge Function





- [x] 4.1 Create booking Edge Function with JWT validation


  - Implement JWT token validation middleware
  - Implement request body validation with Zod
  - Implement idempotency key checking
  - Return 401 for invalid/missing JWT
  - _Requirements: 2.1, 2.2, 4.2_

- [x] 4.2 Implement booking business logic


  - Port booking logic from app/actions/booking.ts
  - Implement capacity checking
  - Implement booking code generation
  - Implement database insertion with service role key
  - Implement capacity increment via RPC
  - _Requirements: 2.1, 4.3_

- [x] 4.3 Implement WhatsApp integration in Edge Function


  - Port WhatsApp sending logic
  - Implement background job pattern
  - Implement error logging to database
  - Use secrets from Deno.env
  - _Requirements: 3.2_

- [x] 4.4 Implement rate limiting for booking endpoint

  - Add rate limiting middleware (10 requests per minute per IP)
  - Return 429 status when limit exceeded
  - Log rate limit violations
  - _Requirements: 11.2_

- [x] 4.5 Implement secure error handling

  - Catch all errors and return generic messages
  - Log detailed errors server-side only
  - Ensure no stack traces in responses
  - Ensure no SQL queries in responses
  - _Requirements: 11.3, 11.4_

- [x] 4.6 Write property tests for booking Edge Function


  - **Property 4: JWT validation before processing**
  - **Property 5: Service role key never sent to client**
  - **Property 7: Rate limiting enforced**
  - **Property 8: Invalid requests return generic errors**
  - **Validates: Requirements 2.2, 6.4, 11.2, 11.3, 11.4**

- [x] 5. Implement Admin Booking Edge Function





- [x] 5.1 Create admin-booking Edge Function with admin auth


  - Implement admin JWT validation
  - Implement admin role verification
  - Implement request validation with Zod
  - Return 403 for non-admin users
  - _Requirements: 10.2, 4.2_

- [x] 5.2 Implement admin booking business logic

  - Port logic from app/api/admin-create-booking/route.ts
  - Implement schedule validation
  - Implement capacity checking
  - Implement booking creation with service role key
  - _Requirements: 10.2, 4.3_

- [x] 5.3 Implement rate limiting for admin endpoint

  - Add rate limiting (20 requests per minute)
  - Return 429 when exceeded
  - _Requirements: 11.2_

- [x] 5.4 Write unit tests for admin Edge Function


  - Test admin JWT validation
  - Test non-admin rejection
  - Test booking creation flow
  - _Requirements: 10.2, 4.2_

- [x] 6. Implement Booking Status Edge Function




- [x] 6.1 Create booking-status Edge Function


  - Implement optional JWT validation (public access allowed)
  - Implement booking code lookup
  - Implement response sanitization (no internal fields)
  - _Requirements: 6.3_

- [x] 6.2 Implement rate limiting for status endpoint

  - Add rate limiting (30 requests per minute per IP)
  - Return 429 when exceeded
  - _Requirements: 11.2_

- [x] 6.3 Write unit tests for booking status endpoint


  - Test public access works
  - Test response doesn't contain internal fields
  - Test rate limiting
  - _Requirements: 6.3, 11.2_

- [x] 7. Update frontend to use Edge Functions





- [x] 7.1 Create booking service client


  - Create lib/booking-service.ts
  - Implement createBooking function that calls Edge Function
  - Implement getBookingStatus function
  - Use NEXT_PUBLIC_SUPABASE_URL for endpoint
  - Include JWT token in Authorization header
  - _Requirements: 6.1, 6.2_


- [x] 7.2 Update booking Server Action to proxy to Edge Function

  - Modify app/actions/booking.ts to call Edge Function
  - Convert FormData to JSON
  - Handle Edge Function response
  - Maintain redirect behavior
  - _Requirements: 10.1_

- [x] 7.3 Update admin booking to use Edge Function


  - Modify app/api/admin-create-booking/route.ts to proxy
  - Or update admin UI to call Edge Function directly
  - Include admin JWT token
  - _Requirements: 10.2_

- [x] 7.4 Update booking status page to use Edge Function


  - Modify app/track/page.tsx to call Edge Function
  - Update app/api/booking-status/route.ts to proxy
  - _Requirements: 10.1_

- [x] 7.5 Write integration tests for frontend-to-Edge-Function flow


  - Test full booking creation flow
  - Test admin booking flow
  - Test booking status retrieval
  - Verify JWT tokens are sent correctly
  - **Validates: Requirements 6.1, 6.2, 10.1, 10.2**

- [x] 8. Configure secrets management






- [x] 8.1 Create .env.example for public reference

  - Include NEXT_PUBLIC_SUPABASE_URL
  - Include NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Include NEXT_PUBLIC_BOOKING_FUNCTION_URL
  - Add comments explaining each variable
  - _Requirements: 3.1_

- [x] 8.2 Document secret setup process


  - Create docs/edge-functions-setup.md
  - Document how to set secrets via Supabase CLI
  - List all required secrets
  - Document how to verify secrets are set
  - _Requirements: 3.1, 3.2_

- [x] 8.3 Update README with security notes


  - Add section on Edge Functions
  - Add section on secret management
  - Add section on local development setup
  - Add warning about not committing functions
  - _Requirements: 3.1_

- [x] 9. Verify RLS policies






- [x] 9.1 Audit all database tables for RLS

  - Query pg_policies to list all RLS policies
  - Verify RLS is enabled on bookings table
  - Verify RLS is enabled on daily_schedules table
  - Verify RLS is enabled on hotels table
  - _Requirements: 4.1_



- [x] 9.2 Test RLS with Edge Functions





  - Test that service role key bypasses RLS when needed
  - Test that user JWT respects RLS policies
  - Test that public access is read-only


  - _Requirements: 4.3, 4.4_

- [x] 9.3 Write property tests for RLS enforcement





  - **Property 6: RLS policies active on all tables**
  - Test that unauthorized access is blocked
  - Test that RLS works across all access methods
  - **Validates: Requirements 4.1, 4.4**

- [x] 10. Configure production build security




- [x] 10.1 Update next.config.mjs for production security


  - Disable source maps in production (productionBrowserSourceMaps: false)
  - Enable minification
  - Configure environment variable validation
  - _Requirements: 12.1, 12.3_

- [x] 10.2 Verify environment variables are used for endpoints


  - Audit code for hardcoded URLs
  - Replace with process.env.NEXT_PUBLIC_* variables
  - _Requirements: 12.2_

- [x] 10.3 Write unit tests for production build configuration


  - **Property 9: Production builds are minified**
  - Test that build output is minified
  - Test that no source maps are in build output
  - Test that environment variables are used
  - **Validates: Requirements 12.1, 12.2, 12.3**

- [x] 11. Deployment and verification





- [x] 11.1 Deploy Edge Functions to Supabase


  - Run supabase login
  - Run supabase link --project-ref <ref>
  - Set all secrets via supabase secrets set
  - Deploy booking function
  - Deploy admin-booking function
  - Deploy booking-status function
  - Verify deployment with curl
  - _Requirements: 8.1, 8.2, 8.4_

- [x] 11.2 Test Edge Functions in production


  - Test booking creation with real JWT
  - Test admin booking with admin JWT
  - Test booking status retrieval
  - Test rate limiting
  - Test error handling
  - _Requirements: 5.4, 11.1, 11.2, 11.3_

- [x] 11.3 Deploy frontend to production


  - Push code to GitHub (verify no functions committed)
  - Configure environment variables in Vercel
  - Deploy via Vercel
  - Test full booking flow in production
  - _Requirements: 10.1, 10.2_



- [x] 11.4 Run security verification checklist

  - Verify no migrations in git history
  - Verify no Edge Function code in git history
  - Verify no secrets in repository
  - Verify RLS is active
  - Verify rate limiting works
  - Verify error messages are generic
  - Verify production build is minified

  - _Requirements: All_

- [x] 11.5 Write end-to-end security tests

  - Test that cloning repo doesn't expose secrets
  - Test that repository scan finds no sensitive data
  - Test that Edge Functions require authentication
  - Test that rate limiting blocks excessive requests
  - **Validates: All security requirements**

- [ ] 12. Documentation and maintenance
- [ ] 12.1 Create comprehensive deployment guide
  - Document local development setup
  - Document Edge Function deployment process
  - Document secret management
  - Document rollback procedures
  - _Requirements: 5.1, 5.2, 5.4, 8.1, 8.2_

- [ ] 12.2 Create security incident response plan
  - Document what to do if secrets are exposed
  - Document what to do if Edge Function code is exposed
  - Document how to rotate keys
  - Document monitoring and alerting
  - _Requirements: 3.1, 3.2_

- [ ] 12.3 Create maintenance checklist
  - Document how to add new Edge Functions
  - Document how to update secrets
  - Document how to monitor Edge Function logs
  - Document how to update RLS policies
  - _Requirements: All_
