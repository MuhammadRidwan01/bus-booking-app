# Booking Status Edge Function

## Overview

The Booking Status Edge Function provides a public API endpoint for retrieving booking information using a booking code. This endpoint is designed for public access and does not require authentication, allowing users to track their bookings easily.

## Security Features

- **Public Access**: No JWT authentication required
- **Response Sanitization**: Only returns public-safe fields, no internal database details
- **Rate Limiting**: 30 requests per minute per IP address
- **Generic Error Messages**: No internal system details exposed in errors

## API Specification

### Endpoint

```
GET https://<project-ref>.functions.supabase.co/booking-status?code=<booking_code>
```

### Request

**Method**: `GET`

**Query Parameters**:
- `code` (required): The booking code (5-50 characters)

**Headers**:
- `Content-Type`: `application/json` (optional)
- `Authorization`: Not required (public endpoint)

**Example Request**:
```bash
curl "https://your-project.functions.supabase.co/booking-status?code=IBX123ABC"
```

### Response

**Success Response (Booking Found)**:
```json
{
  "ok": true,
  "found": true,
  "booking": {
    "bookingCode": "IBX123ABC",
    "customerName": "John Doe",
    "passengerCount": 2,
    "roomNumber": "101",
    "status": "confirmed",
    "hotel": {
      "name": "Ibis styles Jakarta Airport",
      "address": "Jl. Airport, Jakarta"
    },
    "schedule": {
      "date": "2025-01-15",
      "departureTime": "08:00",
      "destination": "Soekarno-Hatta Airport"
    }
  }
}
```

**Success Response (Booking Not Found)**:
```json
{
  "ok": true,
  "found": false,
  "booking": null
}
```

**Error Response (Missing Code)**:
```json
{
  "ok": false,
  "error": "Booking code is required",
  "code": "VALIDATION_ERROR"
}
```

**Error Response (Invalid Format)**:
```json
{
  "ok": false,
  "error": "Invalid booking code format",
  "code": "VALIDATION_ERROR"
}
```

**Error Response (Rate Limited)**:
```json
{
  "ok": false,
  "error": "Too many requests, please try again later",
  "code": "RATE_LIMITED"
}
```

**Response Headers** (Rate Limited):
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: ISO timestamp when limit resets
- `Retry-After`: Seconds to wait before retrying

## Response Fields

### Booking Object

| Field | Type | Description |
|-------|------|-------------|
| `bookingCode` | string | Unique booking identifier |
| `customerName` | string | Name of the customer |
| `passengerCount` | number | Number of passengers (1-5) |
| `roomNumber` | string | Flight number |
| `status` | string | Booking status (`confirmed`, `cancelled`) |
| `hotel` | object | Hotel information |
| `schedule` | object | Schedule information |

### Hotel Object

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Hotel name |
| `address` | string | Hotel address |

### Schedule Object

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Schedule date (ISO format) |
| `departureTime` | string | Departure time (HH:MM format) |
| `destination` | string | Destination name |

## Security Considerations

### What's Included
- ✅ Public booking information (code, customer name, passenger count)
- ✅ Hotel and schedule details
- ✅ Booking status

### What's Excluded (Privacy & Security)
- ❌ Internal database IDs
- ❌ Phone numbers
- ❌ Timestamps (created_at, updated_at)
- ❌ Foreign key references
- ❌ WhatsApp delivery status
- ❌ Idempotency keys
- ❌ Any internal system fields

## Rate Limiting

- **Limit**: 30 requests per minute per IP address
- **Window**: 60 seconds (rolling)
- **Response**: HTTP 429 when exceeded
- **Reset**: Automatic after time window expires

## Error Handling

All errors return generic messages to prevent information leakage:

- **Validation Errors**: Specific field errors (safe)
- **Not Found**: Returns `found: false` (no error)
- **Internal Errors**: Generic "Unable to process request"
- **Rate Limit**: "Too many requests, please try again later"

## Local Development

### Serve Locally

```bash
# Start local Supabase
supabase start

# Serve the function
supabase functions serve booking-status --env-file .env.local

# Test with curl
curl "http://localhost:54321/functions/v1/booking-status?code=IBX123ABC"
```

### Environment Variables

Required in `.env.local`:

```bash
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-local-anon-key
```

## Deployment

### Deploy to Production

```bash
# Login to Supabase
supabase login

# Link to project
supabase link --project-ref <your-project-ref>

# Deploy function
supabase functions deploy booking-status

# Verify deployment
curl "https://<project-ref>.functions.supabase.co/booking-status?code=TEST"
```

### No Secrets Required

This function only uses the anon key (public), so no additional secrets need to be set.

## Testing

### Run Unit Tests

```bash
# Run all tests
pnpm vitest tests/booking-status-edge-function.test.ts --run

# Run with coverage
pnpm vitest tests/booking-status-edge-function.test.ts --coverage
```

### Test Coverage

- ✅ Public access without authentication
- ✅ Valid booking code acceptance
- ✅ Invalid booking code rejection
- ✅ Response sanitization (no internal fields)
- ✅ Rate limiting enforcement
- ✅ Error handling security

## Integration

### Frontend Usage

```typescript
// lib/booking-service.ts
export async function getBookingStatus(bookingCode: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/booking-status?code=${bookingCode}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
  
  return response.json()
}
```

### Usage in Components

```typescript
// app/track/page.tsx
const result = await getBookingStatus(code)

if (result.ok && result.found) {
  // Display booking details
  console.log(result.booking)
} else if (result.ok && !result.found) {
  // Show "booking not found" message
} else {
  // Handle error
  console.error(result.error)
}
```

## Monitoring

### Logs

View function logs in Supabase Dashboard:
1. Go to Edge Functions
2. Select `booking-status`
3. View Logs tab

### Metrics to Monitor

- Request volume per minute
- Rate limit violations
- Error rates
- Response times
- Not found rates

## Troubleshooting

### Common Issues

**Issue**: "Booking code is required"
- **Solution**: Ensure `code` query parameter is included

**Issue**: "Invalid booking code format"
- **Solution**: Booking code must be 5-50 characters

**Issue**: "Too many requests"
- **Solution**: Wait 60 seconds and retry, or reduce request frequency

**Issue**: Booking not found
- **Solution**: Verify booking code is correct (case-sensitive)

## Related Functions

- `booking`: Create new bookings
- `admin-booking`: Admin booking creation

## Requirements Validation

This function validates the following requirements:

- **Requirement 6.3**: Public booking status retrieval
- **Requirement 11.2**: Rate limiting enforcement
- **Requirement 11.3**: Generic error messages
- **Requirement 11.4**: No internal details in responses
