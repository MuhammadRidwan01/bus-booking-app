# Admin Booking Edge Function

This Edge Function handles admin-created bookings with elevated privileges and admin authentication.

## Features

- **Admin JWT Validation**: Validates admin JWT tokens and verifies admin role
- **Admin Role Verification**: Checks user is in `admin_users` table
- **Request Validation**: Uses Zod schema for input validation
- **Schedule Validation**: Validates schedule belongs to hotel and is active
- **Capacity Checking**: Ensures sufficient capacity before booking
- **Rate Limiting**: 20 requests per minute per IP
- **Secure Error Handling**: Generic error messages, no internal details exposed
- **WhatsApp Integration**: Sends booking confirmation via WhatsApp

## Endpoint

```
POST https://<project-ref>.functions.supabase.co/admin-booking
```

## Authentication

Requires admin JWT token in Authorization header:

```
Authorization: Bearer <admin_jwt_token>
```

The token must belong to a user listed in the `admin_users` table.

## Request Body

```json
{
  "hotelId": "uuid",
  "dailyScheduleId": "uuid",
  "customerName": "string",
  "phoneNumber": "string",
  "passengerCount": 1-5,
  "roomNumber": "string"
}
```

### Field Validation

- `hotelId`: Valid UUID
- `dailyScheduleId`: Valid UUID
- `customerName`: Non-empty string
- `phoneNumber`: Minimum 5 characters
- `passengerCount`: Integer between 1 and 5
- `roomNumber`: Non-empty string (Flight number)

## Response

### Success (200)

```json
{
  "ok": true,
  "data": {
    "booking": {
      "id": "uuid",
      "booking_code": "IBX...",
      "customer_name": "string",
      "phone": "62...",
      "passenger_count": 2,
      "room_number": "string",
      "status": "confirmed",
      "hotel_id": "uuid",
      "daily_schedule_id": "uuid"
    },
    "whatsappSent": true
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "ok": false,
  "error": "Authentication required"
}
```

#### 403 Forbidden
```json
{
  "ok": false,
  "error": "Access denied"
}
```

#### 400 Bad Request
```json
{
  "ok": false,
  "error": "Invalid request body"
}
```

#### 429 Too Many Requests
```json
{
  "ok": false,
  "error": "Too many requests, please try again later"
}
```

#### 500 Internal Server Error
```json
{
  "ok": false,
  "error": "Unable to process request"
}
```

## Rate Limiting

- **Limit**: 20 requests per minute per IP address
- **Window**: 60 seconds
- **Response**: 429 status with `Retry-After` header

## Environment Variables

Required environment variables (set via Supabase CLI):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APP_BASE_URL=https://your-domain.com
FONNTE_TOKEN=your-fonnte-token
```

## Deployment

```bash
# Set secrets
supabase secrets set SUPABASE_URL="https://your-project.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
supabase secrets set APP_BASE_URL="https://your-domain.com"
supabase secrets set FONNTE_TOKEN="your-fonnte-token"

# Deploy function
supabase functions deploy admin-booking
```

## Local Development

```bash
# Start local Supabase
supabase start

# Serve function locally
supabase functions serve admin-booking --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/admin-booking \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "123e4567-e89b-12d3-a456-426614174000",
    "dailyScheduleId": "123e4567-e89b-12d3-a456-426614174001",
    "customerName": "Test User",
    "phoneNumber": "081234567890",
    "passengerCount": 2,
    "roomNumber": "GA123"
  }'
```

## Security Features

1. **Admin Authentication**: Only users in `admin_users` table can access
2. **JWT Validation**: Validates JWT token before processing
3. **Rate Limiting**: Prevents abuse with 20 req/min limit
4. **Input Validation**: Zod schema validation for all inputs
5. **Generic Errors**: No internal details exposed in error messages
6. **Service Role Key**: Never exposed to clients, only used server-side
7. **CORS Headers**: Proper CORS configuration for frontend access

## Business Logic

1. Validates admin JWT token and role
2. Validates request body with Zod schema
3. Fetches schedule and validates:
   - Schedule exists
   - Schedule belongs to specified hotel
   - Schedule is active (not cancelled/expired)
   - Sufficient capacity available
4. Generates unique booking code
5. Normalizes phone number to 62 format
6. Creates booking in database
7. Increments capacity via RPC
8. Sends WhatsApp confirmation (background)
9. Returns booking details immediately

## Error Handling

All errors are handled securely:

- **Validation errors**: Specific field errors (safe to expose)
- **Auth errors**: Generic "Authentication required" or "Access denied"
- **Internal errors**: Generic "Unable to process request"
- **No stack traces**: Never exposed to clients
- **No SQL queries**: Never exposed to clients
- **Detailed logging**: Server-side only (visible in Supabase logs)

## Testing

Unit tests are located in `tests/admin-booking-edge-function.test.ts`:

```bash
# Run tests
pnpm vitest run tests/admin-booking-edge-function.test.ts
```

Tests cover:
- Admin JWT validation
- Non-admin rejection (403)
- Booking creation flow
- Rate limiting
- Error handling

## Requirements

Validates the following requirements from the design document:

- **Requirement 10.2**: Admin operations executed through Edge Functions with proper authentication
- **Requirement 4.2**: JWT authentication before allowing access
- **Requirement 11.2**: Rate limiting enforced
- **Requirement 11.3**: Invalid requests return generic errors
- **Requirement 11.4**: No internal details in error responses

## Related Files

- `supabase/functions/_shared/auth.ts` - Admin JWT validation
- `supabase/functions/_shared/rate-limit.ts` - Rate limiting logic
- `supabase/functions/_shared/errors.ts` - Error handling utilities
- `supabase/functions/_shared/cors.ts` - CORS headers
- `tests/admin-booking-edge-function.test.ts` - Unit tests
