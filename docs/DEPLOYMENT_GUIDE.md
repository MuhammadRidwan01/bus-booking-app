# Production Deployment Guide

This guide provides step-by-step instructions for deploying the shuttle bus booking system to production with all security measures in place.

## Prerequisites Checklist

Before starting deployment, ensure you have:

- [ ] Supabase CLI installed (`supabase --version`)
- [ ] Supabase account with project created
- [ ] Project reference ID from Supabase Dashboard
- [ ] Production service role key from Supabase Dashboard
- [ ] Wablas API credentials (token and secret key)
- [ ] Production domain name
- [ ] Vercel account (or other hosting provider)
- [ ] Git repository is clean (no uncommitted changes)

## Part 1: Deploy Edge Functions to Supabase

### Step 1.1: Login to Supabase

```bash
# Login to your Supabase account
supabase login
```

This will open a browser window for authentication. Complete the login process.

### Step 1.2: Link to Production Project

```bash
# Link to your production Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

**To find your project reference:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings > General
4. Copy the "Reference ID"

### Step 1.3: Set Production Secrets

**IMPORTANT**: These secrets will be encrypted and stored securely on Supabase. Never commit them to git.

```bash
# Set Supabase service role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"

# Set WhatsApp API credentials
supabase secrets set WABLAS_TOKEN="YOUR_WABLAS_TOKEN"
supabase secrets set WABLAS_SECRET_KEY="YOUR_WABLAS_SECRET_KEY"
supabase secrets set WABLAS_BASE_URL="https://bdg.wablas.com"

# Set application base URL
supabase secrets set APP_BASE_URL="https://your-production-domain.com"

# Set admin secret (for admin authentication)
supabase secrets set ADMIN_SECRET="YOUR_ADMIN_SECRET"
```

**To find your service role key:**
1. Go to Supabase Dashboard > Settings > API
2. Copy the "service_role" key (keep this secret!)

### Step 1.4: Verify Secrets Are Set

```bash
# List all secrets (values are hidden for security)
supabase secrets list
```

Expected output:
```
NAME                          CREATED_AT
SUPABASE_SERVICE_ROLE_KEY    2024-XX-XX XX:XX:XX
WABLAS_TOKEN                 2024-XX-XX XX:XX:XX
WABLAS_SECRET_KEY            2024-XX-XX XX:XX:XX
WABLAS_BASE_URL              2024-XX-XX XX:XX:XX
APP_BASE_URL                 2024-XX-XX XX:XX:XX
ADMIN_SECRET                 2024-XX-XX XX:XX:XX
```

### Step 1.5: Deploy Edge Functions

```bash
# Deploy booking function
supabase functions deploy booking

# Deploy admin-booking function
supabase functions deploy admin-booking

# Deploy booking-status function
supabase functions deploy booking-status
```

**Alternative**: Deploy all functions at once:
```bash
supabase functions deploy
```

### Step 1.6: Verify Deployment with cURL

Test each function to ensure it's deployed correctly:

```bash
# Test booking function (should return 401 without JWT)
curl -X POST https://YOUR_PROJECT_REF.functions.supabase.co/booking \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Expected response: {"ok":false,"error":"Authentication required"}

# Test admin-booking function
curl -X POST https://YOUR_PROJECT_REF.functions.supabase.co/admin-booking \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Expected response: {"ok":false,"error":"Authentication required"}

# Test booking-status function (public access)
curl "https://YOUR_PROJECT_REF.functions.supabase.co/booking-status?code=TEST123"

# Expected response: {"ok":true,"found":false,"booking":null}
```

✅ **Checkpoint**: All three Edge Functions should be deployed and responding.

---

## Part 2: Test Edge Functions in Production

### Step 2.1: Get a Real JWT Token

You need a valid JWT token to test authenticated endpoints. Options:

**Option A: Use Supabase Dashboard**
1. Go to Supabase Dashboard > Authentication > Users
2. Create a test user or select existing user
3. Click on the user to view details
4. Copy the JWT token

**Option B: Use Your Frontend**
```typescript
// In your Next.js app console
const { data: { session } } = await supabase.auth.getSession()
console.log('JWT Token:', session?.access_token)
```

### Step 2.2: Test Booking Creation

```bash
# Replace YOUR_JWT_TOKEN with actual token
curl -X POST https://YOUR_PROJECT_REF.functions.supabase.co/booking \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "phoneNumber": "081234567890",
    "countryCode": "+62",
    "bookingDate": "2024-12-15",
    "scheduleId": "VALID_SCHEDULE_UUID",
    "passengerCount": 2,
    "roomNumber": "101",
    "idempotencyKey": "test-'$(date +%s)'",
    "hasWhatsapp": "yes"
  }'
```

Expected response:
```json
{
  "ok": true,
  "data": {
    "bookingCode": "IBX...",
    "booking": { ... }
  }
}
```

### Step 2.3: Test Admin Booking

First, ensure you have an admin user in your database. Then get their JWT token.

```bash
# Replace YOUR_ADMIN_JWT_TOKEN with admin user's token
curl -X POST https://YOUR_PROJECT_REF.functions.supabase.co/admin-booking \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "VALID_HOTEL_UUID",
    "dailyScheduleId": "VALID_SCHEDULE_UUID",
    "customerName": "Admin Test",
    "phoneNumber": "081234567890",
    "passengerCount": 1,
    "roomNumber": "202"
  }'
```

### Step 2.4: Test Booking Status Retrieval

```bash
# Use a real booking code from previous test
curl "https://YOUR_PROJECT_REF.functions.supabase.co/booking-status?code=IBX123456"
```

Expected response:
```json
{
  "ok": true,
  "found": true,
  "booking": {
    "bookingCode": "IBX123456",
    "customerName": "Test User",
    ...
  }
}
```

### Step 2.5: Test Rate Limiting

```bash
# Send multiple requests rapidly (should get 429 after limit)
for i in {1..15}; do
  curl -X POST https://YOUR_PROJECT_REF.functions.supabase.co/booking \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"test": "rate-limit"}' &
done
wait
```

Expected: Some requests should return `429 Too Many Requests`

### Step 2.6: Test Error Handling

```bash
# Test with invalid data (should return generic error)
curl -X POST https://YOUR_PROJECT_REF.functions.supabase.co/booking \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

Expected response should NOT contain:
- Stack traces
- SQL queries
- Internal system details
- File paths

✅ **Checkpoint**: All Edge Functions are working correctly in production.

---

## Part 3: Deploy Frontend to Production

### Step 3.1: Verify No Functions Committed

```bash
# Check git status
git status

# Verify no Edge Function code is tracked
git ls-files | grep "supabase/functions/.*\.ts"

# Should return nothing (except _shared utilities)
```

### Step 3.2: Verify No Secrets in Repository

```bash
# Search for potential secrets
git grep -i "service_role"
git grep -i "wablas.*token"
git grep -i "secret.*key"

# Should return no matches in committed files
```

### Step 3.3: Push Code to GitHub

```bash
# Add all changes
git add .

# Commit
git commit -m "Deploy production-ready application"

# Push to main branch
git push origin main
```

### Step 3.4: Configure Environment Variables in Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add the following variables:

**Production Environment Variables:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Edge Function URLs
NEXT_PUBLIC_BOOKING_FUNCTION_URL=https://YOUR_PROJECT_REF.functions.supabase.co/booking
NEXT_PUBLIC_ADMIN_BOOKING_FUNCTION_URL=https://YOUR_PROJECT_REF.functions.supabase.co/admin-booking
NEXT_PUBLIC_BOOKING_STATUS_FUNCTION_URL=https://YOUR_PROJECT_REF.functions.supabase.co/booking-status

# Application Configuration
NEXTAUTH_URL=https://your-production-domain.com
APP_BASE_URL=https://your-production-domain.com

# Cron Secret (for scheduled tasks)
CRON_SECRET=YOUR_CRON_SECRET

# Admin Authentication
ADMIN_SECRET=YOUR_ADMIN_SECRET
```

**IMPORTANT**: Do NOT set `SUPABASE_SERVICE_ROLE_KEY` in Vercel. This should only exist in Supabase Edge Functions.

### Step 3.5: Deploy via Vercel

```bash
# If using Vercel CLI
vercel --prod

# Or trigger deployment via GitHub push (auto-deploy)
```

### Step 3.6: Test Full Booking Flow in Production

1. **Visit your production site**: https://your-production-domain.com
2. **Select a hotel**: Choose Ibis Style or Ibis Budget
3. **Select a schedule**: Pick an available time slot
4. **Fill booking form**:
   - Customer name
   - Phone number
   - Passenger count
   - Room number
5. **Submit booking**
6. **Verify**:
   - Booking code is generated
   - Confirmation page loads
   - WhatsApp message is sent (if enabled)
   - Booking appears in admin dashboard

✅ **Checkpoint**: Full booking flow works end-to-end in production.

---

## Part 4: Security Verification Checklist

Run these checks to ensure all security measures are in place:

### 4.1: Verify No Migrations in Git History

```bash
# Search entire git history for migration files
git log --all --full-history --source -- "supabase/migrations/*.sql"

# Should return no results
```

### 4.2: Verify No Edge Function Code in Git History

```bash
# Search for Edge Function TypeScript files
git log --all --full-history --source -- "supabase/functions/*/index.ts"

# Should only show _shared utilities, not function implementations
```

### 4.3: Verify No Secrets in Repository

```bash
# Run comprehensive secret scan
git grep -E "(service_role|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+|sk_live_|pk_live_)" -- ':!*.md'

# Should return no matches
```

### 4.4: Verify RLS is Active

```bash
# Connect to your production database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run this query
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

# Should return no rows (all tables have RLS enabled)
```

Or use Supabase Dashboard:
1. Go to Database > Tables
2. Check each table has RLS enabled (shield icon)

### 4.5: Verify Rate Limiting Works

Already tested in Step 2.5. Confirm:
- [ ] Booking endpoint: 10 requests/minute limit
- [ ] Admin endpoint: 20 requests/minute limit
- [ ] Status endpoint: 30 requests/minute limit

### 4.6: Verify Error Messages Are Generic

Test various error scenarios:

```bash
# Invalid JWT
curl -X POST https://YOUR_PROJECT_REF.functions.supabase.co/booking \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json"

# Response should be generic: "Authentication required"
# Should NOT contain: stack traces, SQL, file paths
```

### 4.7: Verify Production Build is Minified

```bash
# Build locally
pnpm build

# Check output
ls -lh .next/static/chunks/

# Files should be minified (small size, obfuscated names)
# Check a file - should have no whitespace, short variable names
```

Or check deployed site:
1. Open browser DevTools
2. Go to Sources tab
3. Check JavaScript files are minified
4. Verify no source maps are loaded

✅ **Checkpoint**: All security measures verified.

---

## Part 5: End-to-End Security Tests

### 5.1: Test Repository Clone Doesn't Expose Secrets

```bash
# Clone to a new directory
cd /tmp
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git test-clone
cd test-clone

# Search for secrets
grep -r "service_role" .
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" .

# Should find nothing
```

### 5.2: Test Repository Scan Finds No Sensitive Data

```bash
# Use git-secrets or similar tool
git secrets --scan

# Or use truffleHog
trufflehog git file://. --only-verified

# Should report no secrets found
```

### 5.3: Test Edge Functions Require Authentication

```bash
# Test without JWT (should fail)
curl -X POST https://YOUR_PROJECT_REF.functions.supabase.co/booking \
  -H "Content-Type: application/json" \
  -d '{"customerName": "Test"}'

# Expected: 401 Unauthorized

# Test with invalid JWT (should fail)
curl -X POST https://YOUR_PROJECT_REF.functions.supabase.co/booking \
  -H "Authorization: Bearer fake_token" \
  -H "Content-Type: application/json" \
  -d '{"customerName": "Test"}'

# Expected: 401 Unauthorized
```

### 5.4: Test Rate Limiting Blocks Excessive Requests

Already tested in Step 2.5. Verify:
- [ ] Rate limits are enforced
- [ ] 429 status code is returned
- [ ] Error message is generic

✅ **Checkpoint**: All security tests pass.

---

## Post-Deployment Monitoring

### Monitor Edge Function Logs

1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Select a function
4. View Logs tab
5. Monitor for:
   - Errors
   - Rate limit violations
   - Authentication failures
   - Unusual patterns

### Monitor Database Activity

1. Go to Supabase Dashboard
2. Navigate to Database > Logs
3. Monitor for:
   - Failed RLS policy checks
   - Unusual query patterns
   - Performance issues

### Set Up Alerts

Consider setting up alerts for:
- High error rates in Edge Functions
- Rate limit violations
- Authentication failures
- Database connection issues

---

## Rollback Procedures

### Rollback Edge Functions

```bash
# Keep backup of previous version locally
cp -r supabase/functions supabase/functions.backup

# If needed, redeploy previous version
cd supabase/functions.backup
supabase functions deploy booking
```

### Rollback Frontend

In Vercel Dashboard:
1. Go to Deployments
2. Find previous working deployment
3. Click "..." menu
4. Select "Promote to Production"

---

## Troubleshooting

### Edge Function Not Responding

1. Check function is deployed: `supabase functions list`
2. Check logs in Supabase Dashboard
3. Verify secrets are set: `supabase secrets list`
4. Test locally first: `supabase functions serve booking`

### Authentication Errors

1. Verify JWT token is valid
2. Check token hasn't expired
3. Verify SUPABASE_URL and SUPABASE_ANON_KEY match
4. Check user exists in auth.users table

### Rate Limiting Issues

1. Check if rate limit is too restrictive
2. Verify IP address detection is working
3. Consider implementing user-based rate limiting
4. Check logs for rate limit violations

### WhatsApp Not Sending

1. Verify WABLAS_TOKEN is set correctly
2. Check WABLAS_SECRET_KEY is correct
3. Test Wablas API directly
4. Check Edge Function logs for errors
5. Verify phone number format

---

## Success Criteria

Your deployment is successful when:

- [ ] All Edge Functions are deployed and responding
- [ ] Booking flow works end-to-end
- [ ] Admin operations work correctly
- [ ] No secrets in git repository
- [ ] No migration files in git repository
- [ ] No Edge Function code in git repository
- [ ] RLS is enabled on all tables
- [ ] Rate limiting is working
- [ ] Error messages are generic
- [ ] Production build is minified
- [ ] WhatsApp messages are sending
- [ ] All security tests pass

---

## Next Steps

After successful deployment:

1. **Monitor for 24 hours**: Watch logs for any issues
2. **Test with real users**: Have team members test the system
3. **Document any issues**: Keep track of problems and solutions
4. **Set up monitoring**: Configure alerts for critical issues
5. **Plan regular updates**: Schedule maintenance windows

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Production URL**: _____________

**Project Ref**: _____________

---

