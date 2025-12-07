# Design Document: Database Security & Edge Functions Migration

## Overview

This design implements a comprehensive security architecture to protect the shuttle bus booking system from reverse engineering and unauthorized access. The solution migrates critical business logic from Next.js Server Actions and API Routes to Supabase Edge Functions, ensuring that sensitive code, database schemas, and secrets remain private even though the repository is publicly accessible on GitHub.

### Key Security Principles

1. **Defense in Depth**: Multiple layers of security (gitignore, Edge Functions, RLS, rate limiting, obfuscation)
2. **Least Privilege**: Service role keys only used in secure Edge Functions, never exposed to clients
3. **Separation of Concerns**: Public repository contains only UI code; business logic hosted on Supabase
4. **Zero Trust**: All requests validated and authenticated regardless of source

### Architecture Goals

- Prevent database schema reconstruction from repository inspection
- Hide business logic implementation details
- Secure all API keys and credentials
- Maintain development velocity with local testing
- Enable seamless deployment without repository commits

## Architecture

### Current Architecture (Insecure)

```
┌─────────────┐
│   GitHub    │ ← Public Repository
│  (Public)   │   ├── Server Actions (booking.ts)
└─────────────┘   ├── API Routes (admin-create-booking)
                  ├── Types (full DB schema)
                  ├── Migrations (DB structure)
                  └── .env (gitignored but risky)
       │
       ↓
┌─────────────┐
│   Vercel    │ ← Hosting
│  (Deploy)   │   └── Executes server-side code
└─────────────┘
       │
       ↓
┌─────────────┐
│  Supabase   │ ← Database
│     DB      │   └── Direct access from Next.js
└─────────────┘
```

**Vulnerabilities:**
- ❌ Server Actions expose business logic
- ❌ Types reveal complete database schema
- ❌ Migrations could be reconstructed from types
- ❌ API routes show validation and flow logic

### New Architecture (Secure)

```
┌─────────────┐
│   GitHub    │ ← Public Repository (Minimal)
│  (Public)   │   ├── UI Components only
└─────────────┘   ├── Minimal types (frontend-only)
                  ├── Thin API proxies
                  └── NO migrations, NO functions
       │
       ↓
┌─────────────┐
│   Vercel    │ ← Hosting (UI Only)
│  (Deploy)   │   └── Serves static + SSR pages
└─────────────┘
       │
       ↓ (JWT Auth)
       │
┌─────────────┐
│  Supabase   │ ← Secure Backend
│Edge Functions│  ├── Booking logic
│  (Private)  │  ├── Admin operations
└─────────────┘  ├── Validation & business rules
       │         └── Service role key access
       ↓
┌─────────────┐
│  Supabase   │ ← Database
│     DB      │   └── RLS enforced
└─────────────┘
```

**Security Improvements:**
- ✅ Business logic hidden in Edge Functions (not in repo)
- ✅ Minimal types (no schema exposure)
- ✅ No migrations in repo
- ✅ Service keys only in Edge Functions
- ✅ JWT authentication required
- ✅ Rate limiting at Edge Function level

## Components and Interfaces

### 1. Edge Functions

#### 1.1 Booking Edge Function

**Location:** `supabase/functions/booking/index.ts` (local only, gitignored)

**Purpose:** Handle all booking creation logic securely

**Interface:**
```typescript
// Request
POST https://<project-ref>.functions.supabase.co/booking
Headers:
  Authorization: Bearer <user_jwt_token>
  Content-Type: application/json

Body:
{
  customerName: string
  phoneNumber: string
  countryCode: string
  bookingDate: string (ISO 8601)
  scheduleId: string (UUID)
  passengerCount: number (1-5)
  roomNumber: string
  idempotencyKey: string
  hasWhatsapp: "yes" | "no"
}

// Response (Success)
{
  ok: true
  data: {
    bookingCode: string
    booking: BookingDetails
  }
}

// Response (Error)
{
  ok: false
  error: string
}
```

**Security Features:**
- JWT validation before processing
- Idempotency key to prevent duplicate bookings
- Rate limiting (10 requests per minute per IP)
- Input validation with Zod
- Service role key access (never exposed)

#### 1.2 Admin Booking Edge Function

**Location:** `supabase/functions/admin-booking/index.ts` (local only, gitignored)

**Purpose:** Handle admin-created bookings with elevated privileges

**Interface:**
```typescript
// Request
POST https://<project-ref>.functions.supabase.co/admin-booking
Headers:
  Authorization: Bearer <admin_jwt_token>
  Content-Type: application/json

Body:
{
  hotelId: string (UUID)
  dailyScheduleId: string (UUID)
  customerName: string
  phoneNumber: string
  passengerCount: number (1-5)
  roomNumber: string
}

// Response
{
  ok: true
  data: {
    booking: BookingDetails
    whatsappSent: boolean
  }
}
```

**Security Features:**
- Admin JWT validation
- Admin role verification via RLS
- Audit logging of admin actions
- Rate limiting (20 requests per minute)

#### 1.3 Booking Status Edge Function

**Location:** `supabase/functions/booking-status/index.ts` (local only, gitignored)

**Purpose:** Retrieve booking details by code

**Interface:**
```typescript
// Request
GET https://<project-ref>.functions.supabase.co/booking-status?code=<booking_code>
Headers:
  Authorization: Bearer <user_jwt_token> (optional for public access)

// Response
{
  ok: true
  found: boolean
  booking: BookingDetails | null
}
```

**Security Features:**
- Public read access (no sensitive data exposed)
- Rate limiting (30 requests per minute per IP)
- No database structure revealed in responses

### 2. Frontend Integration Layer

#### 2.1 Booking Service

**Location:** `lib/booking-service.ts` (public repo)

**Purpose:** Thin client wrapper for Edge Function calls

```typescript
export async function createBooking(data: BookingFormData) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/booking`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
  )
  
  return response.json()
}
```

**Note:** No business logic here, just HTTP calls

#### 2.2 Server Action Proxy (Optional)

**Location:** `app/actions/booking.ts` (public repo)

**Purpose:** Maintain existing API for backward compatibility

```typescript
"use server"

export async function createBooking(formData: FormData) {
  // Convert FormData to JSON
  const data = {
    customerName: formData.get("customerName"),
    // ... other fields
  }
  
  // Proxy to Edge Function
  const result = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: { /* ... */ },
    body: JSON.stringify(data)
  })
  
  // Handle response and redirect
  if (result.ok) {
    redirect(`/booking/confirmation?code=${result.bookingCode}`)
  }
}
```

### 3. Git Security Configuration

#### 3.1 Enhanced .gitignore

**Location:** `.gitignore`

**Additions:**
```gitignore
# Supabase Edge Functions (NEVER commit)
supabase/functions/**
!supabase/functions/.gitkeep

# Supabase migrations (NEVER commit)
supabase/migrations/**
!supabase/migrations/.gitkeep

# Generated database types
types/supabase.ts
types/database.ts

# All environment files
.env*
!.env.example

# Supabase local state
supabase/.temp/**
supabase/.branches/**

# Build artifacts
.next/**
out/**
```

#### 3.2 Git Info Exclude (Local Only)

**Location:** `.git/info/exclude` (not tracked by git)

**Purpose:** Additional local ignores for sensitive development files

```
# Local Supabase config
supabase/config.toml

# Local secrets
.env.local
.env.development.local
```

### 4. Secret Management

#### 4.1 Supabase Secrets

**Storage:** Supabase CLI secrets (encrypted, server-side)

**Required Secrets:**
```bash
# Set via CLI (never in code)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJ..."
supabase secrets set WABLAS_API_KEY="..."
supabase secrets set WABLAS_TEMPLATE_ID="..."
supabase secrets set APP_BASE_URL="https://..."
supabase secrets set ADMIN_SECRET="..."
```

**Access in Edge Functions:**
```typescript
// supabase/functions/booking/index.ts
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const wablasApiKey = Deno.env.get('WABLAS_API_KEY')
```

#### 4.2 Environment Variables (Public)

**Location:** `.env.example` (public repo, no secrets)

```bash
# Public Supabase config (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (anon key, public)

# Edge Function URLs (public)
NEXT_PUBLIC_BOOKING_FUNCTION_URL=https://your-project.functions.supabase.co/booking
```

### 5. Type System Security

#### 5.1 Minimal Public Types

**Location:** `types/index.ts` (public repo)

**Strategy:** Only include types needed for UI, no database internals

```typescript
// BEFORE (Exposes DB structure)
export interface Booking {
  id: string
  booking_code: string
  hotel_id: string
  daily_schedule_id: string
  customer_name: string
  phone: string
  passenger_count: number
  status: "confirmed" | "cancelled"
  whatsapp_sent: boolean
  whatsapp_attempts?: number
  whatsapp_last_error?: string | null
  created_at: string
  updated_at: string
  idempotency_key?: string
}

// AFTER (Minimal, UI-focused)
export interface BookingConfirmation {
  bookingCode: string
  customerName: string
  hotelName: string
  departureTime: string
  scheduleDate: string
}

export interface BookingFormData {
  customerName: string
  phoneNumber: string
  countryCode: string
  bookingDate: string
  scheduleId: string
  passengerCount: number
  roomNumber: string
  hasWhatsapp: "yes" | "no"
}
```

#### 5.2 Generated Types (Local Only)

**Location:** `types/supabase.ts` (gitignored)

**Generation:**
```bash
# Generate locally, never commit
supabase gen types typescript --local > types/supabase.ts
```

**Usage:** Only in Edge Functions (not in public repo)

## Data Models

### Edge Function Data Flow

```
┌──────────────┐
│   Frontend   │
│  (FormData)  │
└──────┬───────┘
       │
       │ HTTP POST + JWT
       ↓
┌──────────────┐
│Edge Function │
│  Validation  │ ← Zod schema validation
└──────┬───────┘
       │
       │ Validated data
       ↓
┌──────────────┐
│  Business    │
│    Logic     │ ← Capacity check, code generation
└──────┬───────┘
       │
       │ Service role key
       ↓
┌──────────────┐
│  Supabase    │
│   Database   │ ← RLS enforced
└──────┬───────┘
       │
       │ Booking created
       ↓
┌──────────────┐
│  WhatsApp    │
│   Service    │ ← Background job
└──────────────┘
```

### Database Access Patterns

**Edge Functions use service role key for:**
- Creating bookings (bypasses RLS for system operations)
- Updating capacity (atomic RPC calls)
- Admin operations (with additional auth checks)

**RLS Policies remain active:**
- Users can only read their own bookings (via booking_code)
- Admin users verified via JWT claims
- Public endpoints have read-only access to non-sensitive data

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Repository contains no migration files

*For any* clone of the public repository, inspecting the file system should reveal zero SQL migration files in any directory.

**Validates: Requirements 1.1, 1.2**

### Property 2: Edge Function code is never committed

*For any* git commit in the repository history, the supabase/functions directory should contain no TypeScript files.

**Validates: Requirements 1.3, 2.4**

### Property 3: No secrets in repository

*For any* file tracked by git, scanning for patterns matching API keys, service role keys, or authentication tokens should return zero matches.

**Validates: Requirements 3.3, 3.4**

### Property 4: JWT validation before processing

*For any* request to an Edge Function, if the JWT token is invalid or missing, the system should reject the request with a 401 status before executing any business logic.

**Validates: Requirements 2.2, 4.2**

### Property 5: Service role key never sent to client

*For any* HTTP response from the application, the response body and headers should never contain the SUPABASE_SERVICE_ROLE_KEY value.

**Validates: Requirements 6.4**

### Property 6: RLS policies active on all tables

*For any* table in the database, querying pg_policies should confirm that Row Level Security is enabled and at least one policy exists.

**Validates: Requirements 4.1, 4.4**

### Property 7: Rate limiting enforced

*For any* IP address making requests to an Edge Function, if more than N requests are made within 1 minute, subsequent requests should be rejected with a 429 status.

**Validates: Requirements 11.2**

### Property 8: Invalid requests return generic errors

*For any* malformed or invalid request to an Edge Function, the error response should not contain stack traces, SQL queries, or internal system details.

**Validates: Requirements 11.3, 11.4**

### Property 9: Production builds are minified

*For any* production build output, JavaScript files should be minified (no whitespace, obfuscated variable names) and contain no source map references.

**Validates: Requirements 12.1, 12.3**

### Property 10: Types do not expose full schema

*For any* TypeScript interface in the public repository's types directory, the interface should not contain database-internal fields like id, created_at, updated_at, or foreign key references.

**Validates: Requirements 9.1, 9.3, 9.4**

## Error Handling

### Edge Function Error Strategy

**Principle:** Fail securely - never expose internal details

```typescript
// Edge Function error handling pattern
try {
  // Business logic
} catch (error) {
  console.error('[Internal]', error) // Log internally
  
  return new Response(
    JSON.stringify({
      ok: false,
      error: 'Unable to process request' // Generic message
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}
```

### Error Categories

1. **Validation Errors (400)**
   - User-facing, specific (e.g., "Phone number is required")
   - Safe to expose, no system details

2. **Authentication Errors (401)**
   - Generic message: "Authentication required"
   - No details about why auth failed

3. **Authorization Errors (403)**
   - Generic message: "Access denied"
   - No details about permissions

4. **Rate Limit Errors (429)**
   - Message: "Too many requests, please try again later"
   - No details about limits

5. **Server Errors (500)**
   - Generic message: "Unable to process request"
   - Detailed error logged server-side only

### Logging Strategy

**Edge Functions:**
- Use `console.error()` for internal logging
- Logs visible in Supabase dashboard (not public)
- Include request ID for tracing
- Never log sensitive data (passwords, full tokens)

**Frontend:**
- Log only user-facing errors
- Use error tracking service (e.g., Sentry) with sanitization
- Never log API keys or tokens

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive security coverage.

**Unit Tests:** Verify specific security configurations and edge cases
**Property Tests:** Verify security properties hold across all inputs

### Property-Based Testing

**Library:** `fast-check` (TypeScript/JavaScript property testing)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with design document property reference
- Format: `// Feature: database-security, Property N: <property_text>`

**Property Test Examples:**

```typescript
// Feature: database-security, Property 4: JWT validation before processing
test('Edge Function rejects invalid JWT tokens', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string(), // Random invalid tokens
      async (invalidToken) => {
        const response = await fetch(edgeFunctionUrl, {
          headers: { 'Authorization': `Bearer ${invalidToken}` }
        })
        return response.status === 401
      }
    ),
    { numRuns: 100 }
  )
})

// Feature: database-security, Property 7: Rate limiting enforced
test('Rate limiting blocks excessive requests', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 11, max: 50 }), // Request counts above limit
      async (requestCount) => {
        const responses = await Promise.all(
          Array(requestCount).fill(null).map(() => 
            fetch(edgeFunctionUrl, { method: 'POST' })
          )
        )
        const rateLimited = responses.filter(r => r.status === 429)
        return rateLimited.length > 0
      }
    ),
    { numRuns: 100 }
  )
})
```

### Unit Testing

**Test Categories:**

1. **Git Configuration Tests**
   - Verify .gitignore excludes sensitive files
   - Verify no migrations in git history
   - Verify no secrets in tracked files

2. **Edge Function Tests**
   - Test JWT validation logic
   - Test input validation with Zod
   - Test error handling (no stack traces)
   - Test rate limiting logic

3. **Type System Tests**
   - Verify public types are minimal
   - Verify no database internals exposed
   - Verify generated types are gitignored

4. **Integration Tests**
   - Test full booking flow through Edge Function
   - Test admin operations with proper auth
   - Test error scenarios end-to-end

**Test Framework:** Vitest (for Next.js compatibility)

**Example Unit Tests:**

```typescript
describe('Git Security', () => {
  test('gitignore excludes Edge Functions', () => {
    const gitignore = fs.readFileSync('.gitignore', 'utf-8')
    expect(gitignore).toContain('supabase/functions/**')
  })
  
  test('no migration files in git', () => {
    const files = execSync('git ls-files').toString()
    expect(files).not.toMatch(/supabase\/migrations\/.*\.sql/)
  })
})

describe('Edge Function Security', () => {
  test('rejects requests without JWT', async () => {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      body: JSON.stringify({ /* valid data */ })
    })
    expect(response.status).toBe(401)
  })
  
  test('error responses are generic', async () => {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer invalid' },
      body: JSON.stringify({ invalid: 'data' })
    })
    const json = await response.json()
    expect(json.error).not.toContain('stack')
    expect(json.error).not.toContain('SQL')
  })
})
```

### Testing Edge Functions Locally

**Setup:**
```bash
# Start local Supabase
supabase start

# Serve Edge Functions locally
supabase functions serve booking --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/booking \
  -H "Authorization: Bearer <test_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Test","phoneNumber":"123456789",...}'
```

**Test Data:**
- Use local Supabase instance with seed data
- Generate test JWT tokens via Supabase auth
- Mock WhatsApp API calls in test environment

## Deployment Strategy

### Local Development Workflow

1. **Setup:**
   ```bash
   # Clone repo (no functions or migrations)
   git clone <repo>
   cd bus-booking-app
   
   # Install dependencies
   pnpm install
   
   # Start local Supabase (includes DB)
   supabase start
   
   # Create Edge Functions locally (not tracked)
   mkdir -p supabase/functions/booking
   # ... write function code
   
   # Set local secrets
   echo "SUPABASE_SERVICE_ROLE_KEY=..." > .env.local
   ```

2. **Development:**
   ```bash
   # Serve Edge Functions locally
   supabase functions serve booking --env-file .env.local
   
   # In another terminal, run Next.js
   pnpm dev
   
   # Test booking flow
   # Frontend → localhost:54321/functions/v1/booking → local DB
   ```

3. **Testing:**
   ```bash
   # Run unit tests
   pnpm test
   
   # Run property tests
   pnpm test:properties
   
   # Test Edge Function directly
   curl -X POST http://localhost:54321/functions/v1/booking ...
   ```

### Production Deployment Workflow

1. **Deploy Edge Functions (First Time):**
   ```bash
   # Login to Supabase
   supabase login
   
   # Link to project
   supabase link --project-ref <your-project-ref>
   
   # Set production secrets
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY="..."
   supabase secrets set WABLAS_API_KEY="..."
   supabase secrets set WABLAS_TEMPLATE_ID="..."
   supabase secrets set APP_BASE_URL="https://your-domain.com"
   
   # Deploy Edge Functions (from local files, not git)
   supabase functions deploy booking
   supabase functions deploy admin-booking
   supabase functions deploy booking-status
   
   # Verify deployment
   curl https://<project-ref>.functions.supabase.co/booking
   ```

2. **Deploy Frontend (Vercel):**
   ```bash
   # Push to GitHub (only UI code)
   git add .
   git commit -m "Update UI"
   git push origin main
   
   # Vercel auto-deploys from GitHub
   # Set environment variables in Vercel dashboard:
   # - NEXT_PUBLIC_SUPABASE_URL
   # - NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

3. **Update Edge Functions:**
   ```bash
   # Modify function locally
   # Test locally with supabase functions serve
   
   # Deploy updated function (no git commit needed)
   supabase functions deploy booking
   
   # Verify update
   curl https://<project-ref>.functions.supabase.co/booking
   ```

### CI/CD Considerations

**What to automate:**
- ✅ Frontend deployment (Vercel from GitHub)
- ✅ Unit tests on PR
- ✅ Property tests on PR
- ✅ Security scanning (no secrets in commits)

**What NOT to automate:**
- ❌ Edge Function deployment (manual, from local)
- ❌ Database migrations (manual, not in repo)
- ❌ Secret management (manual via CLI)

**Rationale:** Edge Functions and migrations are intentionally kept out of CI/CD to prevent exposure in GitHub Actions logs or artifacts.

### Rollback Strategy

**Edge Functions:**
```bash
# List deployed versions
supabase functions list

# Rollback to previous version (if needed)
# Note: Supabase doesn't have built-in rollback, so:
# 1. Keep local backup of previous version
# 2. Redeploy previous version
supabase functions deploy booking
```

**Frontend:**
- Use Vercel's built-in rollback feature
- Revert git commit and redeploy

**Database:**
- Migrations not in repo, so manual rollback via SQL
- Keep backup of migration files locally

## Security Checklist

### Pre-Deployment Verification

- [ ] No migration files in git history
- [ ] No Edge Function code in git history
- [ ] No secrets in .env files tracked by git
- [ ] .gitignore includes all sensitive paths
- [ ] Public types are minimal (no DB internals)
- [ ] LICENSE file with restrictive terms
- [ ] All Edge Functions deployed to Supabase
- [ ] All secrets set via Supabase CLI
- [ ] RLS enabled on all tables
- [ ] Rate limiting configured
- [ ] Error messages are generic
- [ ] Production build is minified
- [ ] Source maps removed from production

### Post-Deployment Verification

- [ ] Edge Functions respond correctly
- [ ] JWT validation working
- [ ] Rate limiting active
- [ ] Booking flow works end-to-end
- [ ] Admin operations require auth
- [ ] Error responses don't leak info
- [ ] WhatsApp integration working
- [ ] No secrets in browser network tab
- [ ] Repository scan shows no secrets

## Maintenance

### Adding New Edge Functions

1. Create locally: `supabase/functions/new-function/index.ts`
2. Test locally: `supabase functions serve new-function`
3. Deploy: `supabase functions deploy new-function`
4. Update frontend to call new endpoint
5. **Never commit function code to git**

### Updating Secrets

```bash
# Update secret
supabase secrets set SECRET_NAME="new_value"

# Verify (secrets are encrypted, this just confirms it exists)
supabase secrets list

# Redeploy functions to pick up new secret
supabase functions deploy booking
```

### Monitoring

**Edge Function Logs:**
- View in Supabase Dashboard → Edge Functions → Logs
- Monitor for errors, rate limit hits, auth failures

**Security Alerts:**
- Set up GitHub secret scanning alerts
- Monitor Supabase audit logs for unusual activity
- Track rate limit violations

### Incident Response

**If secrets are exposed:**
1. Immediately rotate all keys in Supabase dashboard
2. Update secrets via CLI: `supabase secrets set ...`
3. Redeploy all Edge Functions
4. Review git history for exposure
5. If in git history, consider repo rotation

**If Edge Function code is exposed:**
1. Review what logic was exposed
2. Consider refactoring to add additional security layers
3. Update rate limiting rules
4. Monitor for unusual activity

## Future Enhancements

### Potential Improvements

1. **Request Signing:** Add HMAC signatures for additional request validation
2. **IP Whitelisting:** Restrict admin endpoints to specific IPs
3. **Audit Logging:** Comprehensive logging of all admin actions
4. **Anomaly Detection:** ML-based detection of unusual booking patterns
5. **Encrypted Responses:** Encrypt sensitive data in responses
6. **Multi-Factor Auth:** Require MFA for admin operations
7. **Honeypot Endpoints:** Fake endpoints to detect scanning attempts

### Scalability Considerations

- Edge Functions auto-scale with Supabase
- Rate limiting may need adjustment based on traffic
- Consider CDN for static assets
- Database connection pooling for high load
