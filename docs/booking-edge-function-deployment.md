# Booking Edge Function Deployment Guide

This guide covers deploying the secure booking Edge Function to Supabase.

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Supabase project created
- Local development environment set up

## Step 1: Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

## Step 2: Link to Your Project

```bash
supabase link --project-ref <your-project-ref>
```

Find your project ref in the Supabase Dashboard URL:
`https://app.supabase.com/project/<project-ref>`

## Step 3: Set Required Secrets

The booking Edge Function requires the following environment variables:

```bash
# Supabase configuration
supabase secrets set SUPABASE_URL="https://<your-project-ref>.supabase.co"
supabase secrets set SUPABASE_ANON_KEY="<your-anon-key>"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"

# WhatsApp integration
supabase secrets set WABLAS_API_KEY="<your-wablas-api-key>"

# Application URL
supabase secrets set APP_BASE_URL="https://your-domain.com"
```

### Where to Find Keys

1. **SUPABASE_URL**: Project Settings → API → Project URL
2. **SUPABASE_ANON_KEY**: Project Settings → API → Project API keys → anon public
3. **SUPABASE_SERVICE_ROLE_KEY**: Project Settings → API → Project API keys → service_role (⚠️ Keep secret!)
4. **WABLAS_API_KEY**: Your Wablas dashboard
5. **APP_BASE_URL**: Your production domain (e.g., https://shuttle.ibisjakarta.com)

### Verify Secrets

```bash
supabase secrets list
```

## Step 4: Deploy the Function

```bash
supabase functions deploy booking
```

Expected output:
```
Deploying function booking...
Function booking deployed successfully.
URL: https://<project-ref>.functions.supabase.co/booking
```

## Step 5: Test the Deployment

### Get a Test JWT Token

1. Go to your app and login
2. Open browser DevTools → Application → Local Storage
3. Find the Supabase auth token

Or use Supabase Dashboard:
1. Authentication → Users → Select a user
2. Copy the JWT token

### Test with curl

```bash
curl -X POST https://<project-ref>.functions.supabase.co/booking \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "phoneNumber": "081234567890",
    "countryCode": "62",
    "bookingDate": "2025-01-20",
    "scheduleId": "<valid-schedule-id>",
    "passengerCount": 2,
    "roomNumber": "101",
    "idempotencyKey": "test-deployment-123",
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

## Step 6: Update Frontend Configuration

Update your `.env.production` or Vercel environment variables:

```bash
NEXT_PUBLIC_BOOKING_FUNCTION_URL=https://<project-ref>.functions.supabase.co/booking
```

## Step 7: Monitor the Function

### View Logs

1. Go to Supabase Dashboard
2. Edge Functions → booking → Logs
3. Monitor for errors or issues

### Check Metrics

- Request count
- Error rate
- Response times
- Rate limit violations

## Troubleshooting

### Function Returns 500 Error

**Check secrets are set:**
```bash
supabase secrets list
```

**View function logs:**
```bash
supabase functions logs booking
```

**Common issues:**
- Missing SUPABASE_SERVICE_ROLE_KEY
- Invalid WABLAS_API_KEY
- Wrong SUPABASE_URL format

### Authentication Errors (401)

**Verify JWT token:**
- Token must be valid and not expired
- Token must be from the same Supabase project
- Authorization header format: `Bearer <token>`

**Test with a fresh token:**
1. Login to your app
2. Get new JWT from browser storage
3. Retry the request

### Rate Limiting (429)

**Wait and retry:**
- Rate limit: 10 requests per minute per IP
- Wait 60 seconds before retrying

**Check if legitimate traffic:**
- Multiple users behind same IP (corporate network)
- Consider increasing rate limit in code

### WhatsApp Not Sending

**Check Wablas configuration:**
```bash
supabase secrets list | grep WABLAS
```

**Verify phone number format:**
- Must start with country code (62 for Indonesia)
- No spaces or special characters
- Example: 628123456789

**Check booking record:**
```sql
SELECT whatsapp_sent, whatsapp_last_error 
FROM bookings 
WHERE booking_code = 'IBX...';
```

## Updating the Function

### Make Changes Locally

1. Edit `supabase/functions/booking/index.ts`
2. Test locally:
   ```bash
   supabase functions serve booking --env-file .env.local
   ```

### Deploy Updates

```bash
supabase functions deploy booking
```

**Note:** No git commit needed! Edge Functions are deployed directly from local files.

## Rollback

If you need to rollback:

1. Checkout previous version from git:
   ```bash
   git checkout <previous-commit> supabase/functions/booking/
   ```

2. Redeploy:
   ```bash
   supabase functions deploy booking
   ```

## Security Checklist

Before going to production:

- [ ] All secrets set via Supabase CLI
- [ ] Service role key never committed to git
- [ ] Function code not in git repository
- [ ] JWT validation working
- [ ] Rate limiting active
- [ ] Error messages are generic
- [ ] Logs show no sensitive data
- [ ] Test booking flow end-to-end
- [ ] WhatsApp integration working
- [ ] Monitoring set up

## Production Deployment Checklist

- [ ] Function deployed to production
- [ ] Secrets configured correctly
- [ ] Frontend updated with function URL
- [ ] Test booking with real data
- [ ] Monitor logs for errors
- [ ] Verify WhatsApp messages sent
- [ ] Check rate limiting works
- [ ] Test error scenarios
- [ ] Document any issues

## Support

If you encounter issues:

1. Check function logs in Supabase Dashboard
2. Verify all secrets are set correctly
3. Test with curl to isolate frontend issues
4. Check Wablas API status
5. Review error messages in logs

## Related Documentation

- [Edge Functions Setup](./edge-functions-setup.md)
- [Local Development Quickstart](./LOCAL_DEVELOPMENT_QUICKSTART.md)
- [Booking Edge Function README](../supabase/functions/booking/README.md)
