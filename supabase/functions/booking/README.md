# Booking Edge Function

Secure serverless function for handling shuttle bus booking operations.

## Features

- ✅ JWT token validation
- ✅ Request body validation with Zod
- ✅ Idempotency key support
- ✅ Rate limiting (10 requests/minute per IP)
- ✅ Capacity checking
- ✅ Booking code generation
- ✅ WhatsApp integration
- ✅ Secure error handling (no internal details exposed)

## API Endpoint

```
POST https://<project-ref>.functions.supabase.co/booking
```

## Request

### Headers

```
Authorization: Bearer <user_jwt_token>
Content-Type: application/json
```

### Body

```json
{
  "customerName": "John Doe",
  "phoneNumber": "081234567890",
  "countryCode": "62",
  "bookingDate": "2025-01-15",
  "scheduleId": "123e4567-e89b-12d3-a456-426614174000",
  "passengerCount": 2,
  "roomNumber": "GA123",
  "idempotencyKey": "unique-key-123",
  "hasWhatsapp": "yes"
}
```

## Response

### Success (200)

```json
{
  "ok": true,
  "data": {
    "bookingCode": "IBX1234ABC",
    "booking": {
      "id": "uuid",
      "booking_code": "IBX1234ABC",
      "customer_name": "John Doe",
      "phone": "62812345678",
      "passenger_count": 2,
      "room_number": "101",
      "status": "confirmed"
    }
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "ok": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

#### 400 Bad Request
```json
{
  "ok": false,
  "error": "Invalid request data",
  "code": "VALIDATION_ERROR"
}
```

#### 429 Too Many Requests
```json
{
  "ok": false,
  "error": "Too many requests, please try again later",
  "code": "RATE_LIMITED"
}
```

#### 500 Internal Server Error
```json
{
  "ok": false,
  "error": "Unable to process request",
  "code": "INTERNAL_ERROR"
}
```

## Environment Variables

Required secrets (set via Supabase CLI):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FONNTE_TOKEN=your-fonnte-token
APP_BASE_URL=https://your-domain.com
```

## Local Development

### Start local Supabase
```bash
supabase start
```

### Serve function locally
```bash
supabase functions serve booking --env-file .env.local
```

### Test with curl
```bash
curl -X POST http://localhost:54321/functions/v1/booking \
  -H "Authorization: Bearer <test_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "phoneNumber": "081234567890",
    "countryCode": "62",
    "bookingDate": "2025-01-15",
    "scheduleId": "123e4567-e89b-12d3-a456-426614174000",
    "passengerCount": 2,
    "roomNumber": "GA123",
    "idempotencyKey": "test-key-123",
    "hasWhatsapp": "yes"
  }'
```

## Deployment

### Set secrets
```bash
supabase secrets set SUPABASE_URL="https://your-project.supabase.co"
supabase secrets set SUPABASE_ANON_KEY="your-anon-key"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
supabase secrets set FONNTE_TOKEN="your-fonnte-token"
supabase secrets set APP_BASE_URL="https://your-domain.com"
```

### Deploy function
```bash
supabase functions deploy booking
```

### Verify deployment
```bash
curl https://<project-ref>.functions.supabase.co/booking
```

## Security Features

### JWT Validation
- All requests must include valid JWT token
- Invalid/missing tokens return 401 immediately
- No business logic executed without authentication

### Rate Limiting
- 10 requests per minute per IP address
- Exceeding limit returns 429 status
- Rate limit violations are logged

### Secure Error Handling
- Generic error messages to clients
- Detailed errors logged server-side only
- No stack traces in responses
- No SQL queries in responses
- No internal file paths exposed

### Idempotency
- Duplicate requests with same idempotency key return existing booking
- Prevents double-booking from network retries

### Service Role Key Protection
- Service role key only used server-side
- Never exposed in responses or headers
- Used only for authorized backend operations

## Testing

Property-based tests verify:
- ✅ JWT validation before processing
- ✅ Service role key never sent to client
- ✅ Rate limiting enforced
- ✅ Invalid requests return generic errors

Run tests:
```bash
pnpm vitest tests/booking-edge-function.test.ts --run
```

## Monitoring

View logs in Supabase Dashboard:
- Edge Functions → booking → Logs
- Monitor for errors, rate limit hits, auth failures

## Troubleshooting

### Function not responding
1. Check function is deployed: `supabase functions list`
2. Check secrets are set: `supabase secrets list`
3. View logs in Supabase Dashboard

### Authentication errors
1. Verify JWT token is valid
2. Check token is included in Authorization header
3. Ensure token format is "Bearer <token>"

### Rate limit errors
1. Wait 1 minute before retrying
2. Check if multiple clients using same IP
3. Consider increasing rate limit if legitimate traffic

### WhatsApp not sending
1. Check FONNTE_TOKEN is set correctly
2. Verify phone number format (62xxx)
3. Check Fonnte API status
4. View booking record for whatsapp_last_error

## Related Files

- `supabase/functions/_shared/auth.ts` - JWT validation
- `supabase/functions/_shared/cors.ts` - CORS handling
- `supabase/functions/_shared/rate-limit.ts` - Rate limiting
- `supabase/functions/_shared/errors.ts` - Error handling
- `tests/booking-edge-function.test.ts` - Property tests
