# Deployment Overview

This document provides a quick overview of the deployment process for the shuttle bus booking system with all security measures in place.

## Quick Links

- [Full Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete step-by-step deployment instructions
- [Frontend Deployment](./FRONTEND_DEPLOYMENT.md) - Frontend-specific deployment guide
- [Edge Functions Setup](./edge-functions-setup.md) - Edge Functions development and deployment

## Security Architecture

The application uses a multi-layered security approach:

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub (Public)                       │
│  ✓ UI Components only                                   │
│  ✓ Minimal types (no DB schema)                         │
│  ✓ No migrations                                        │
│  ✓ No Edge Functions                                    │
│  ✓ No secrets                                           │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                     │
│  ✓ Static + SSR pages                                   │
│  ✓ Public environment variables only                    │
│  ✓ Minified JavaScript                                  │
│  ✓ No source maps                                       │
└─────────────────────────────────────────────────────────┘
                            ↓ JWT Auth
┌─────────────────────────────────────────────────────────┐
│              Supabase Edge Functions (Private)           │
│  ✓ Business logic                                       │
│  ✓ JWT validation                                       │
│  ✓ Rate limiting                                        │
│  ✓ Service role key access                              │
│  ✓ Generic error messages                               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                Supabase Database (Secure)                │
│  ✓ Row Level Security (RLS)                             │
│  ✓ Encrypted at rest                                    │
│  ✓ No direct public access                              │
└─────────────────────────────────────────────────────────┘
```

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All Edge Functions are implemented locally
- [ ] All tests pass (unit, property, integration, security)
- [ ] No secrets in repository
- [ ] No migrations in repository
- [ ] No Edge Function code in repository
- [ ] .gitignore is properly configured
- [ ] LICENSE file is restrictive
- [ ] Documentation is complete

## Quick Deployment Steps

### 1. Verify Security

```bash
# Run verification script
./scripts/verify-deployment.sh

# Or on Windows
.\scripts\verify-deployment.ps1

# Run security tests
pnpm vitest run tests/security-verification.test.ts
pnpm vitest run tests/e2e-security.test.ts
```

### 2. Deploy Edge Functions

```bash
# Login to Supabase
supabase login

# Link to project
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="..."
supabase secrets set WABLAS_TOKEN="..."
supabase secrets set WABLAS_SECRET_KEY="..."
supabase secrets set APP_BASE_URL="https://your-domain.com"

# Deploy functions
supabase functions deploy booking
supabase functions deploy admin-booking
supabase functions deploy booking-status
```

### 3. Test Edge Functions

```bash
# Test in production
SUPABASE_PROJECT_REF=your-project-ref \
./scripts/test-production-edge-functions.sh
```

### 4. Deploy Frontend

```bash
# Push to GitHub
git push origin main

# Configure environment variables in Vercel:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - NEXTAUTH_URL
# - APP_BASE_URL
# - CRON_SECRET
# - ADMIN_SECRET

# Deploy (automatic via Vercel)
```

### 5. Verify Deployment

```bash
# Visit production site
# Test booking flow
# Check browser DevTools (no secrets exposed)
# Verify JavaScript is minified
```

## Security Features Implemented

### Repository Security
- ✅ No migration files in git
- ✅ No Edge Function implementations in git
- ✅ No secrets in git (current or history)
- ✅ Restrictive .gitignore
- ✅ Restrictive LICENSE

### Code Security
- ✅ Minimal types (no DB schema exposure)
- ✅ Production source maps disabled
- ✅ JavaScript minification enabled
- ✅ Environment variables for all endpoints

### Edge Functions Security
- ✅ JWT authentication required
- ✅ Rate limiting (10/min booking, 20/min admin, 30/min status)
- ✅ Generic error messages (no stack traces)
- ✅ Service role key never exposed
- ✅ Input validation with Zod
- ✅ CORS properly configured

### Database Security
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Service role key only in Edge Functions
- ✅ No direct database access from frontend
- ✅ Audit logging for admin actions

## Testing

### Run All Tests

```bash
# Unit tests
pnpm vitest run tests/git-security.test.ts
pnpm vitest run tests/type-security.test.ts
pnpm vitest run tests/production-build-security.test.ts

# Property tests
pnpm vitest run tests/rls-property.test.ts

# Integration tests
pnpm vitest run tests/booking-edge-function.test.ts
pnpm vitest run tests/admin-booking-edge-function.test.ts
pnpm vitest run tests/booking-status-edge-function.test.ts
pnpm vitest run tests/rls-edge-functions.test.ts

# Security verification
pnpm vitest run tests/security-verification.test.ts
pnpm vitest run tests/e2e-security.test.ts

# All tests
pnpm test
```

### Test Coverage

- ✅ Git security (no secrets, no migrations, no functions)
- ✅ Type security (minimal types)
- ✅ Production build security (minified, no source maps)
- ✅ RLS enforcement (property-based tests)
- ✅ Edge Functions (authentication, rate limiting, errors)
- ✅ End-to-end security (repository clone, scanning, authentication)

## Monitoring

### Supabase Dashboard

1. **Edge Functions Logs**
   - Go to Edge Functions > [Function] > Logs
   - Monitor for errors, rate limits, auth failures

2. **Database Logs**
   - Go to Database > Logs
   - Monitor for RLS violations, unusual queries

3. **Auth Logs**
   - Go to Authentication > Logs
   - Monitor for failed login attempts

### Vercel Dashboard

1. **Deployment Logs**
   - Go to Deployments > [Latest] > Logs
   - Monitor for build errors

2. **Runtime Logs**
   - Go to Deployments > [Latest] > Runtime Logs
   - Monitor for application errors

## Rollback Procedures

### Rollback Edge Functions

```bash
# Redeploy previous version from local backup
cd supabase/functions.backup
supabase functions deploy booking
```

### Rollback Frontend

In Vercel Dashboard:
1. Go to Deployments
2. Find previous working deployment
3. Click "..." > "Promote to Production"

## Troubleshooting

### Edge Functions Not Responding

1. Check deployment: `supabase functions list`
2. Check logs in Supabase Dashboard
3. Verify secrets: `supabase secrets list`
4. Test locally: `supabase functions serve booking`

### Authentication Errors

1. Verify JWT token is valid
2. Check token hasn't expired
3. Verify SUPABASE_URL and SUPABASE_ANON_KEY match
4. Check user exists in auth.users table

### Rate Limiting Issues

1. Check if rate limit is too restrictive
2. Verify IP address detection is working
3. Check logs for rate limit violations

### WhatsApp Not Sending

1. Verify WABLAS_TOKEN is set correctly
2. Check WABLAS_SECRET_KEY is correct
3. Test Wablas API directly
4. Check Edge Function logs for errors

## Support

For issues or questions:

1. Check documentation in `docs/` directory
2. Review test files for examples
3. Check Supabase logs for errors
4. Review Vercel logs for frontend issues

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Edge Functions Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)

---

**Last Updated**: December 2024

**Security Status**: ✅ All security measures implemented and tested

