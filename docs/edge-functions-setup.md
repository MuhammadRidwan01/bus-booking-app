# Edge Functions Setup Guide

This guide explains how to set up, develop, test, and deploy Supabase Edge Functions for the shuttle bus booking system.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Creating Edge Functions](#creating-edge-functions)
5. [Testing Edge Functions Locally](#testing-edge-functions-locally)
6. [Deploying to Production](#deploying-to-production)
7. [Managing Secrets](#managing-secrets)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Edge Functions are serverless functions that run on Supabase infrastructure. They provide a secure way to execute server-side logic without exposing sensitive code or credentials in the public repository.

### Why Edge Functions?

- **Security**: Business logic and service role keys stay on Supabase servers
- **Privacy**: Function code is not committed to the repository
- **Scalability**: Auto-scaling serverless infrastructure
- **Performance**: Deployed globally on edge network

### Architecture

```
Frontend (Next.js)
    ↓ (JWT token)
Edge Functions (Supabase)
    ↓ (Service role key)
Database (PostgreSQL + RLS)
```

---

## Prerequisites

### Required Tools

1. **Supabase CLI** - For managing Edge Functions
   ```bash
   # Install via npm
   npm install -g supabase
   
   # Or via Homebrew (macOS)
   brew install supabase/tap/supabase
   
   # Verify installation
   supabase --version
   ```

2. **Deno** - Runtime for Edge Functions (installed automatically by Supabase CLI)

3. **Git** - For version control (Edge Functions are gitignored)

### Supabase Account

- Create a Supabase project at https://supabase.com
- Note your project reference ID (found in project settings)

---

## Local Development Setup

### Step 1: Start Local Supabase

```bash
# Navigate to project root
cd bus-booking-app

# Start local Supabase instance
supabase start

# This will output:
# - API URL: http://localhost:54321
# - DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# - Studio URL: http://localhost:54323
# - Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# - Service role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note**: Save these credentials for local development!

### Step 2: Configure Environment Variables

```bash
# Copy example environment file
cp .env.local.example .env.local

# Edit .env.local with your local Supabase credentials
# Use the keys from `supabase start` output
```

Example `.env.local` for local development:

```bash
# Local Supabase (from supabase start output)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App config
APP_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
CRON_SECRET=local-dev-secret

# WhatsApp (use test credentials or mock)
WABLAS_BASE_URL=https://bdg.wablas.com
WABLAS_TOKEN=your-test-token
WABLAS_SECRET_KEY=your-test-secret
```

### Step 3: Verify Setup

```bash
# Check Supabase status
supabase status

# Access Supabase Studio (database UI)
# Open http://localhost:54323 in browser
```

---

## Creating Edge Functions

### Directory Structure

Edge Functions are stored locally in `supabase/functions/` but **NOT committed to git**:

```
supabase/functions/
├── _shared/              # Shared utilities (committed)
│   ├── cors.ts          # CORS headers
│   ├── auth.ts          # JWT validation
│   ├── rate-limit.ts    # Rate limiting
│   └── errors.ts        # Error handling
├── booking/             # Booking function (NOT committed)
│   └── index.ts
├── admin-booking/       # Admin function (NOT committed)
│   └── index.ts
└── booking-status/      # Status function (NOT committed)
    └── index.ts
```

### Example: Creating a Booking Edge Function

Create `supabase/functions/booking/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, corsJsonResponse, handleCorsPreFlight } from '../_shared/cors.ts'
import { validateJWT } from '../_shared/auth.ts'
import { applyRateLimit, createRateLimitResponse } from '../_shared/rate-limit.ts'
import { handleError, parseRequestBody, validateRequiredFields, createValidationErrorResponse } from '../_shared/errors.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight()
  }

  try {
    // Rate limiting (10 requests per minute)
    const rateLimitResult = applyRateLimit(req, 10, 60000, 'booking')
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult)
    }

    // JWT validation
    const authHeader = req.headers.get('Authorization')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const authResult = await validateJWT(authHeader, supabaseUrl, supabaseAnonKey)
    if (!authResult.authenticated) {
      return corsJsonResponse({ ok: false, error: 'Authentication required' }, 401)
    }

    // Parse and validate request body
    const body = await parseRequestBody<any>(req)
    if (!body) {
      return corsJsonResponse({ ok: false, error: 'Invalid request body' }, 400)
    }

    const requiredFields = ['customerName', 'phoneNumber', 'scheduleId', 'passengerCount']
    const missingFields = validateRequiredFields(body, requiredFields)
    if (missingFields.length > 0) {
      return createValidationErrorResponse(missingFields)
    }

    // Business logic here
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // ... implement booking logic ...

    return corsJsonResponse({
      ok: true,
      data: { bookingCode: 'IBX123456' }
    })

  } catch (error) {
    return handleError(error, 'booking-function')
  }
})
```

---

## Testing Edge Functions Locally

### Serve a Single Function

```bash
# Serve the booking function
supabase functions serve booking --env-file .env.local

# Output:
# Serving functions on http://localhost:54321/functions/v1/
# - booking: http://localhost:54321/functions/v1/booking
```

### Test with cURL

```bash
# Test booking function
curl -X POST http://localhost:54321/functions/v1/booking \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "phoneNumber": "081234567890",
    "countryCode": "+62",
    "scheduleId": "uuid-here",
    "passengerCount": 2,
    "roomNumber": "101",
    "hasWhatsapp": "yes"
  }'
```

### Generate Test JWT Token

```bash
# In Supabase Studio (http://localhost:54323)
# Go to Authentication > Users
# Create a test user or use existing
# Copy the JWT token from the user details
```

Or programmatically:

```typescript
// In your Next.js app
const { data: { session } } = await supabase.auth.getSession()
console.log('JWT Token:', session?.access_token)
```

### View Function Logs

Logs appear in the terminal where you ran `supabase functions serve`:

```bash
# Logs show:
# - Request details
# - Console.log() output
# - Errors and stack traces
```

---

## Deploying to Production

### Step 1: Login to Supabase

```bash
# Login with your Supabase account
supabase login

# This opens a browser for authentication
```

### Step 2: Link to Your Project

```bash
# Link to your production project
supabase link --project-ref your-project-ref

# Find your project ref in Supabase Dashboard > Settings > General
```

### Step 3: Set Production Secrets

```bash
# Set all required secrets
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-production-service-role-key"
supabase secrets set WABLAS_TOKEN="your-production-wablas-token"
supabase secrets set WABLAS_SECRET_KEY="your-production-wablas-secret"
supabase secrets set APP_BASE_URL="https://your-production-domain.com"

# Verify secrets are set (values are encrypted)
supabase secrets list
```

### Step 4: Deploy Edge Functions

```bash
# Deploy booking function
supabase functions deploy booking

# Deploy admin-booking function
supabase functions deploy admin-booking

# Deploy booking-status function
supabase functions deploy booking-status

# Deploy all functions at once
supabase functions deploy
```

### Step 5: Verify Deployment

```bash
# Test production endpoint
curl https://your-project-ref.functions.supabase.co/booking

# Should return CORS headers or authentication error
```

### Step 6: Update Frontend Environment Variables

In your Vercel/hosting dashboard, set:

```bash
NEXT_PUBLIC_BOOKING_FUNCTION_URL=https://your-project-ref.functions.supabase.co/booking
NEXT_PUBLIC_ADMIN_BOOKING_FUNCTION_URL=https://your-project-ref.functions.supabase.co/admin-booking
NEXT_PUBLIC_BOOKING_STATUS_FUNCTION_URL=https://your-project-ref.functions.supabase.co/booking-status
```

---

## Managing Secrets

### Setting Secrets

```bash
# Set a secret
supabase secrets set SECRET_NAME="secret-value"

# Set multiple secrets from file
supabase secrets set --env-file .env.production
```

### Listing Secrets

```bash
# List all secrets (values are hidden)
supabase secrets list

# Output:
# NAME                          CREATED_AT
# SUPABASE_SERVICE_ROLE_KEY    2024-01-15 10:30:00
# WABLAS_TOKEN                 2024-01-15 10:31:00
```

### Updating Secrets

```bash
# Update a secret (same command as setting)
supabase secrets set SECRET_NAME="new-value"

# Redeploy functions to pick up new secrets
supabase functions deploy
```

### Deleting Secrets

```bash
# Delete a secret
supabase secrets unset SECRET_NAME
```

### Accessing Secrets in Edge Functions

```typescript
// In your Edge Function
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const wablasToken = Deno.env.get('WABLAS_TOKEN')

// Always check if secret exists
if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Command not found: supabase"

**Solution**: Install Supabase CLI
```bash
npm install -g supabase
```

#### 2. "Failed to start local Supabase"

**Solution**: Check Docker is running
```bash
docker --version
docker ps
```

#### 3. "Function not found" when serving locally

**Solution**: Ensure function directory exists and has index.ts
```bash
ls -la supabase/functions/booking/
# Should show index.ts
```

#### 4. "Authentication failed" when deploying

**Solution**: Re-login to Supabase
```bash
supabase logout
supabase login
```

#### 5. "Secret not found" in Edge Function

**Solution**: Set the secret via CLI
```bash
supabase secrets set SECRET_NAME="value"
supabase functions deploy function-name
```

#### 6. CORS errors in browser

**Solution**: Ensure CORS headers are included in all responses
```typescript
import { corsHeaders } from '../_shared/cors.ts'

return new Response(JSON.stringify(data), {
  headers: {
    ...corsHeaders,
    'Content-Type': 'application/json'
  }
})
```

### Debugging Tips

1. **Check function logs**:
   ```bash
   # Local logs appear in terminal
   # Production logs in Supabase Dashboard > Edge Functions > Logs
   ```

2. **Test with verbose output**:
   ```bash
   supabase functions serve booking --env-file .env.local --debug
   ```

3. **Verify environment variables**:
   ```typescript
   console.log('Environment check:', {
     hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
     hasWablasToken: !!Deno.env.get('WABLAS_TOKEN'),
   })
   ```

4. **Test JWT validation**:
   ```bash
   # Get a valid JWT from your app
   # Test with curl including Authorization header
   ```

---

## Best Practices

### Security

1. **Never commit Edge Function code** - Keep functions local only
2. **Use secrets for all credentials** - Never hardcode API keys
3. **Validate all inputs** - Use Zod or similar for validation
4. **Return generic errors** - Don't expose internal details
5. **Implement rate limiting** - Prevent abuse

### Development Workflow

1. **Develop locally first** - Test with `supabase functions serve`
2. **Test thoroughly** - Use curl or Postman for testing
3. **Deploy to staging** - Test in production-like environment
4. **Deploy to production** - Only after thorough testing
5. **Monitor logs** - Check for errors after deployment

### Code Organization

1. **Use shared utilities** - DRY principle for common code
2. **Keep functions focused** - One responsibility per function
3. **Document your code** - Add comments for complex logic
4. **Handle errors gracefully** - Use try-catch and error handlers
5. **Log appropriately** - Log errors server-side, not to clients

---

## Additional Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Edge Functions Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)

---

## Quick Reference

### Common Commands

```bash
# Local development
supabase start                                    # Start local Supabase
supabase stop                                     # Stop local Supabase
supabase status                                   # Check status
supabase functions serve <name>                   # Serve function locally

# Production deployment
supabase login                                    # Login to Supabase
supabase link --project-ref <ref>                 # Link to project
supabase secrets set KEY="value"                  # Set secret
supabase functions deploy <name>                  # Deploy function
supabase functions list                           # List deployed functions

# Secrets management
supabase secrets list                             # List secrets
supabase secrets set KEY="value"                  # Set/update secret
supabase secrets unset KEY                        # Delete secret
```

### Environment Variables

| Variable | Purpose | Where to Set |
|----------|---------|--------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Database admin access | Supabase secrets |
| `WABLAS_TOKEN` | WhatsApp API | Supabase secrets |
| `WABLAS_SECRET_KEY` | WhatsApp API | Supabase secrets |
| `APP_BASE_URL` | App URL for links | Supabase secrets |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | Frontend env |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key | Frontend env |

---

**Last Updated**: December 2024
