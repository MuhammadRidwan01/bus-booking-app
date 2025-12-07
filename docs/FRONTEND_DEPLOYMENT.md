# Frontend Deployment Guide

This guide covers deploying the Next.js frontend to production (Vercel or similar platforms).

## Pre-Deployment Checklist

Before deploying the frontend, ensure:

- [ ] Edge Functions are deployed to Supabase
- [ ] All secrets are set in Supabase (not in frontend)
- [ ] No Edge Function code is committed to git
- [ ] No migration files are committed to git
- [ ] No secrets in repository
- [ ] Production build is tested locally
- [ ] Environment variables are prepared

## Step 1: Verify Repository is Clean

### 1.1: Run Security Verification

```bash
# Run the verification script
./scripts/verify-deployment.sh

# Or on Windows
.\scripts\verify-deployment.ps1
```

Expected output: All critical checks should pass.

### 1.2: Verify No Functions Committed

```bash
# Check for tracked Edge Function files
git ls-files | grep "supabase/functions/.*\.ts"

# Should only show _shared utilities, not function implementations
```

Expected output:
```
supabase/functions/_shared/auth.ts
supabase/functions/_shared/cors.ts
supabase/functions/_shared/errors.ts
supabase/functions/_shared/rate-limit.ts
```

### 1.3: Verify No Secrets

```bash
# Search for potential secrets
git grep -i "service_role"
git grep -i "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]{100,}"

# Should return no matches in code files
```

## Step 2: Test Production Build Locally

### 2.1: Build the Application

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build
```

### 2.2: Verify Build Output

```bash
# Check build output
ls -lh .next/static/chunks/

# Files should be minified
# Check a file - should have no whitespace, short variable names
cat .next/static/chunks/[some-file].js | head -20
```

### 2.3: Test Production Build Locally

```bash
# Start production server
pnpm start

# Visit http://localhost:3000
# Test booking flow
# Verify everything works
```

## Step 3: Push Code to GitHub

### 3.1: Commit Changes

```bash
# Check status
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Production deployment: Security hardening complete"
```

### 3.2: Push to Repository

```bash
# Push to main branch
git push origin main

# Or push to production branch
git push origin production
```

### 3.3: Verify Push

```bash
# Check GitHub repository
# Ensure no Edge Function implementations are visible
# Ensure no migration files are visible
# Ensure no secrets are visible
```

## Step 4: Configure Environment Variables in Vercel

### 4.1: Access Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings > Environment Variables

### 4.2: Add Production Environment Variables

Add the following variables for **Production** environment:

#### Supabase Configuration

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

**To find these values:**
1. Go to Supabase Dashboard > Settings > API
2. Copy "Project URL" for NEXT_PUBLIC_SUPABASE_URL
3. Copy "anon public" key for NEXT_PUBLIC_SUPABASE_ANON_KEY

#### Edge Function URLs (Optional)

If your frontend directly calls Edge Functions:

```bash
NEXT_PUBLIC_BOOKING_FUNCTION_URL=https://YOUR_PROJECT_REF.functions.supabase.co/booking
NEXT_PUBLIC_ADMIN_BOOKING_FUNCTION_URL=https://YOUR_PROJECT_REF.functions.supabase.co/admin-booking
NEXT_PUBLIC_BOOKING_STATUS_FUNCTION_URL=https://YOUR_PROJECT_REF.functions.supabase.co/booking-status
```

#### Application Configuration

```bash
NEXTAUTH_URL=https://your-production-domain.com
APP_BASE_URL=https://your-production-domain.com
```

#### Cron Secret

```bash
CRON_SECRET=YOUR_CRON_SECRET
```

Generate a secure random string:
```bash
openssl rand -base64 32
```

#### Admin Authentication

```bash
ADMIN_SECRET=YOUR_ADMIN_SECRET
```

Use the same value you set in Supabase secrets.

### 4.3: Important Notes

**DO NOT SET THESE IN VERCEL:**
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - This should ONLY exist in Supabase Edge Functions
- ❌ `WABLAS_TOKEN` - This should ONLY exist in Supabase Edge Functions
- ❌ `WABLAS_SECRET_KEY` - This should ONLY exist in Supabase Edge Functions

**Why?** These secrets should never be accessible from the frontend or build process.

### 4.4: Verify Environment Variables

After adding all variables:

1. Check that all required variables are set
2. Verify no sensitive keys (service_role) are present
3. Save changes

## Step 5: Deploy via Vercel

### Option A: Automatic Deployment (Recommended)

If you have Vercel connected to your GitHub repository:

1. Push to main branch (already done in Step 3)
2. Vercel automatically detects the push
3. Vercel builds and deploys
4. Wait for deployment to complete
5. Check deployment logs for errors

### Option B: Manual Deployment via CLI

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts to configure project
```

### Option C: Manual Deployment via Dashboard

1. Go to Vercel Dashboard
2. Click "Deploy" button
3. Select branch to deploy
4. Wait for deployment to complete

## Step 6: Test Full Booking Flow in Production

### 6.1: Access Production Site

Visit your production URL: `https://your-production-domain.com`

### 6.2: Test User Booking Flow

1. **Home Page**
   - [ ] Page loads correctly
   - [ ] Hotel selection works
   - [ ] Images load

2. **Hotel Selection**
   - [ ] Click on Ibis Style or Ibis Budget
   - [ ] Redirects to booking page

3. **Schedule Selection**
   - [ ] Schedules load from database
   - [ ] Capacity indicators show correctly
   - [ ] Can select a schedule

4. **Booking Form**
   - [ ] Form fields are present
   - [ ] Validation works
   - [ ] Phone number formatting works
   - [ ] Room number field works

5. **Submit Booking**
   - [ ] Form submits successfully
   - [ ] Booking code is generated
   - [ ] Redirects to confirmation page
   - [ ] Confirmation page shows booking details

6. **WhatsApp Integration**
   - [ ] WhatsApp message is sent (if enabled)
   - [ ] Message contains booking code
   - [ ] Message contains QR code

7. **Booking Tracking**
   - [ ] Visit `/track` page
   - [ ] Enter booking code
   - [ ] Booking details load correctly

### 6.3: Test Admin Flow

1. **Admin Login**
   - [ ] Visit `/admin/login`
   - [ ] Enter admin credentials
   - [ ] Login successful

2. **Admin Dashboard**
   - [ ] Dashboard loads
   - [ ] Statistics show correctly
   - [ ] Navigation works

3. **View Bookings**
   - [ ] Visit `/admin/bookings`
   - [ ] Bookings list loads
   - [ ] Can filter bookings
   - [ ] Can search bookings

4. **Create Admin Booking**
   - [ ] Fill booking form
   - [ ] Submit booking
   - [ ] Booking created successfully

5. **Manage Schedules**
   - [ ] Visit `/admin/schedules`
   - [ ] Schedules load
   - [ ] Can view capacity

### 6.4: Test Error Scenarios

1. **Invalid Booking Code**
   - [ ] Enter invalid code in tracking
   - [ ] Shows "not found" message
   - [ ] No error details exposed

2. **Full Schedule**
   - [ ] Try to book a full schedule
   - [ ] Shows appropriate error
   - [ ] No technical details exposed

3. **Invalid Form Data**
   - [ ] Submit form with invalid data
   - [ ] Validation errors show
   - [ ] No stack traces visible

## Step 7: Verify Security in Production

### 7.1: Check Browser Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Perform a booking
4. Check requests:
   - [ ] No service_role key in requests
   - [ ] Only anon key is sent
   - [ ] JWT tokens are sent for authenticated requests
   - [ ] No secrets in request/response bodies

### 7.2: Check JavaScript Source

1. Open browser DevTools
2. Go to Sources tab
3. Check JavaScript files:
   - [ ] Code is minified
   - [ ] Variable names are obfuscated
   - [ ] No source maps loaded
   - [ ] No readable business logic

### 7.3: Check for Exposed Secrets

```bash
# Check production site source
curl https://your-production-domain.com | grep -i "service_role"

# Should return no matches
```

### 7.4: Test Rate Limiting

Use the production test script:

```bash
SUPABASE_PROJECT_REF=your-project-ref \
./scripts/test-production-edge-functions.sh
```

## Step 8: Monitor Production

### 8.1: Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Go to Deployments > [Latest] > Logs
4. Monitor for errors

### 8.2: Supabase Logs

1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Check logs for each function
4. Monitor for:
   - Authentication failures
   - Rate limit violations
   - Errors

### 8.3: Set Up Alerts

Consider setting up alerts for:
- Deployment failures
- High error rates
- Performance issues
- Security incidents

## Rollback Procedures

### Rollback via Vercel Dashboard

1. Go to Vercel Dashboard
2. Go to Deployments
3. Find previous working deployment
4. Click "..." menu
5. Select "Promote to Production"

### Rollback via Git

```bash
# Revert to previous commit
git revert HEAD

# Or reset to specific commit
git reset --hard <commit-hash>

# Push to trigger redeployment
git push origin main --force
```

## Troubleshooting

### Build Fails

**Check:**
- All dependencies are installed
- No TypeScript errors
- Environment variables are set correctly
- Build logs in Vercel dashboard

**Solution:**
```bash
# Test build locally
pnpm build

# Fix any errors
# Push fixes to GitHub
```

### Environment Variables Not Working

**Check:**
- Variables are set in correct environment (Production)
- Variable names are correct (case-sensitive)
- No typos in values
- Variables are saved

**Solution:**
1. Go to Vercel Settings > Environment Variables
2. Verify all variables
3. Redeploy if needed

### Booking Flow Not Working

**Check:**
- Edge Functions are deployed
- Edge Function URLs are correct
- JWT authentication is working
- Database is accessible

**Solution:**
1. Test Edge Functions directly with curl
2. Check Supabase logs
3. Check browser console for errors

### WhatsApp Not Sending

**Check:**
- WABLAS secrets are set in Supabase
- Edge Function has access to secrets
- Phone number format is correct

**Solution:**
1. Check Edge Function logs in Supabase
2. Test Wablas API directly
3. Verify secrets are correct

## Post-Deployment Checklist

After successful deployment:

- [ ] All pages load correctly
- [ ] Booking flow works end-to-end
- [ ] Admin dashboard works
- [ ] WhatsApp messages send
- [ ] No secrets exposed in browser
- [ ] JavaScript is minified
- [ ] Rate limiting works
- [ ] Error messages are generic
- [ ] Monitoring is set up
- [ ] Team is notified of deployment

## Success Criteria

Your frontend deployment is successful when:

✅ Production site is accessible
✅ All features work correctly
✅ No secrets are exposed
✅ Security measures are in place
✅ Performance is acceptable
✅ Monitoring is active

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Production URL**: _____________

**Vercel Project**: _____________

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Environment Variables Best Practices](https://vercel.com/docs/concepts/projects/environment-variables)

