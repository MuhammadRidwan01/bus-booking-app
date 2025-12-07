# Edge Functions - Important Security Notice

## ⚠️ Critical Information

**Edge Functions are NOT committed to this repository for security reasons.**

The `supabase/functions/` directory contains only:
- `.gitkeep` files to maintain directory structure
- `_shared/` utilities (CORS, auth, rate limiting, error handling)

**Actual Edge Function implementations are kept locally and deployed directly to Supabase.**

## Why Edge Functions Are Not in the Repository

1. **Protect Business Logic**: Prevents reverse engineering of booking algorithms
2. **Secure Credentials**: Service role keys never exposed in code
3. **Hide Implementation**: Database queries and validation logic remain private
4. **Prevent Schema Inference**: Attackers can't reconstruct database structure

## What Are Edge Functions?

Edge Functions are serverless functions that run on Supabase infrastructure. They handle:

- **Booking Creation** - Process new shuttle bus bookings
- **Admin Operations** - Manage bookings with elevated privileges  
- **Booking Status** - Retrieve booking information securely

## Architecture

```
┌─────────────┐
│   GitHub    │ ← Public Repository (UI code only)
│  (Public)   │   ├── Components
└─────────────┘   ├── Pages
                  └── Minimal types
       │
       ↓
┌─────────────┐
│   Vercel    │ ← Hosting (Frontend only)
└─────────────┘
       │
       ↓ (JWT Auth)
┌─────────────┐
│  Supabase   │ ← Edge Functions (Private)
│Edge Functions│  ├── Business logic
│  (Private)  │  ├── Service role key
└─────────────┘  └── Database operations
       │
       ↓
┌─────────────┐
│  Database   │ ← PostgreSQL + RLS
└─────────────┘
```

## For Developers

### Local Development

1. **Setup Local Supabase**:
   ```bash
   supabase start
   ```

2. **Create Edge Functions Locally**:
   ```bash
   # Create function directory (not tracked by git)
   mkdir -p supabase/functions/booking
   
   # Create function code
   # See docs/edge-functions-setup.md for examples
   ```

3. **Serve Functions Locally**:
   ```bash
   supabase functions serve booking --env-file .env.local
   ```

4. **Test with cURL**:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/booking \
     -H "Authorization: Bearer YOUR_JWT" \
     -H "Content-Type: application/json" \
     -d '{"customerName":"Test",...}'
   ```

### Production Deployment

1. **Set Secrets**:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY="..."
   supabase secrets set WABLAS_TOKEN="..."
   ```

2. **Deploy Functions**:
   ```bash
   supabase functions deploy booking
   supabase functions deploy admin-booking
   supabase functions deploy booking-status
   ```

3. **Update Frontend Environment Variables**:
   ```bash
   NEXT_PUBLIC_BOOKING_FUNCTION_URL=https://your-ref.functions.supabase.co/booking
   ```

### Complete Setup Guide

See [docs/edge-functions-setup.md](./edge-functions-setup.md) for:
- Detailed setup instructions
- Function implementation examples
- Testing strategies
- Troubleshooting guide
- Best practices

## Security Features

### Edge Functions Implement

- ✅ **JWT Validation** - All requests authenticated
- ✅ **Rate Limiting** - Prevent abuse (10-30 req/min)
- ✅ **Input Validation** - Zod schemas for type safety
- ✅ **Generic Errors** - No internal details exposed
- ✅ **Service Role Security** - Keys never sent to client
- ✅ **RLS Enforcement** - Database policies active

### Repository Protection

- ✅ **No Migration Files** - Database schema not exposed
- ✅ **No Function Code** - Business logic private
- ✅ **No Secrets** - All credentials in Supabase secrets
- ✅ **Minimal Types** - Only UI-focused interfaces
- ✅ **Restrictive License** - "All Rights Reserved"

## Available Edge Functions

### 1. Booking Function
- **Endpoint**: `/functions/v1/booking`
- **Method**: POST
- **Auth**: JWT required
- **Rate Limit**: 10 requests/minute
- **Purpose**: Create new shuttle bus bookings

### 2. Admin Booking Function
- **Endpoint**: `/functions/v1/admin-booking`
- **Method**: POST
- **Auth**: Admin JWT required
- **Rate Limit**: 20 requests/minute
- **Purpose**: Admin-created bookings

### 3. Booking Status Function
- **Endpoint**: `/functions/v1/booking-status`
- **Method**: GET
- **Auth**: Optional (public read)
- **Rate Limit**: 30 requests/minute
- **Purpose**: Retrieve booking by code

## Shared Utilities

The `_shared/` directory contains reusable utilities (committed to repo):

- **cors.ts** - CORS headers and response helpers
- **auth.ts** - JWT validation and admin verification
- **rate-limit.ts** - Request rate limiting
- **errors.ts** - Standardized error handling

These utilities are safe to commit as they contain no secrets or business logic.

## Environment Variables

### Required for Edge Functions (Supabase Secrets)

```bash
SUPABASE_SERVICE_ROLE_KEY  # Database admin access
WABLAS_TOKEN               # WhatsApp API token
WABLAS_SECRET_KEY          # WhatsApp API secret
APP_BASE_URL               # Application base URL
```

### Required for Frontend (Public)

```bash
NEXT_PUBLIC_SUPABASE_URL              # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY         # Public anon key
NEXT_PUBLIC_BOOKING_FUNCTION_URL      # Booking endpoint
NEXT_PUBLIC_ADMIN_BOOKING_FUNCTION_URL # Admin endpoint
NEXT_PUBLIC_BOOKING_STATUS_FUNCTION_URL # Status endpoint
```

## FAQ

### Q: Why can't I see the Edge Function code?

**A**: For security reasons, Edge Function implementations are not committed to the repository. They contain sensitive business logic and database operations that should remain private.

### Q: How do I develop new Edge Functions?

**A**: Create them locally in `supabase/functions/`, test with `supabase functions serve`, then deploy with `supabase functions deploy`. See the setup guide for details.

### Q: What if I clone this repo?

**A**: You'll get the UI code and shared utilities, but you'll need to implement your own Edge Functions based on the design document and requirements.

### Q: How do I update an Edge Function?

**A**: Modify the function locally, test it, then redeploy with `supabase functions deploy <name>`. No git commit needed!

### Q: Are the shared utilities safe to commit?

**A**: Yes! The `_shared/` utilities contain no secrets or business logic. They're generic helpers for CORS, auth, rate limiting, and error handling.

### Q: How do I rotate secrets?

**A**: Use `supabase secrets set KEY="new-value"` then redeploy functions with `supabase functions deploy`.

## Support

For issues or questions:
1. Check [docs/edge-functions-setup.md](./edge-functions-setup.md)
2. Review [Supabase Edge Functions docs](https://supabase.com/docs/guides/functions)
3. Check Supabase Dashboard logs for errors

---

**Remember**: Edge Functions are a critical security layer. Keep them local, deploy them securely, and never commit them to the repository!
