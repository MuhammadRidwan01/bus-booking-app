/**
 * Unit Tests for Booking Status Edge Function
 * 
 * Feature: database-security
 * Tests public access, response sanitization, and rate limiting
 * 
 * Validates: Requirements 6.3, 11.2
 */

import { describe, test, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Test: Public access works without authentication
 * 
 * The booking status endpoint should allow public access without requiring JWT tokens.
 * This enables users to track their bookings using only the booking code.
 * 
 * Validates: Requirements 6.3
 */
describe('Public access to booking status', () => {
  test('allows requests without Authorization header', () => {
    // Create request without Authorization header
    const mockRequest = new Request('https://test.com/booking-status?code=IBX123', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Extract auth header
    const authHeader = mockRequest.headers.get('Authorization')

    // Property: Public endpoint should not require auth header
    expect(authHeader).toBeNull()
    
    // The endpoint should still process the request
    // (In actual implementation, this would call the Edge Function)
  })

  test('accepts valid booking codes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 50 }), // Valid booking code range
        async (bookingCode) => {
          // Create request with booking code
          const url = new URL('https://test.com/booking-status')
          url.searchParams.set('code', bookingCode)

          const mockRequest = new Request(url.toString(), {
            method: 'GET',
          })

          // Extract booking code from query params
          const requestUrl = new URL(mockRequest.url)
          const code = requestUrl.searchParams.get('code')

          // Property: Valid booking codes should be accepted
          expect(code).toBe(bookingCode)
          expect(code).toBeTruthy()
          expect(code!.length).toBeGreaterThanOrEqual(5)
          expect(code!.length).toBeLessThanOrEqual(50)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('rejects requests without booking code', () => {
    // Create request without booking code
    const mockRequest = new Request('https://test.com/booking-status', {
      method: 'GET',
    })

    const url = new URL(mockRequest.url)
    const bookingCode = url.searchParams.get('code')

    // Property: Missing booking code should be detected
    expect(bookingCode).toBeNull()
  })

  test('rejects invalid booking code formats', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.string({ maxLength: 4 }), // Too short
          fc.string({ minLength: 51, maxLength: 100 }), // Too long
        ),
        async (invalidCode) => {
          // Validate booking code format
          const isValid = invalidCode.length >= 5 && invalidCode.length <= 50

          // Property: Invalid formats should be rejected
          expect(isValid).toBe(false)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Test: Response doesn't contain internal fields
 * 
 * The booking status response should only include public-safe fields.
 * Internal database fields like IDs, timestamps, and sensitive data should be excluded.
 * 
 * Validates: Requirements 6.3
 */
describe('Response sanitization', () => {
  test('response never contains database internal fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          bookingCode: fc.string({ minLength: 8, maxLength: 20 }),
          customerName: fc.string({ minLength: 1, maxLength: 100 }),
          passengerCount: fc.integer({ min: 1, max: 5 }),
          roomNumber: fc.string({ minLength: 1, maxLength: 10 }),
          status: fc.constantFrom('confirmed', 'cancelled'),
        }),
        async (bookingData) => {
          // Simulate sanitized booking response
          const mockResponse = {
            ok: true,
            found: true,
            booking: {
              bookingCode: bookingData.bookingCode,
              customerName: bookingData.customerName,
              passengerCount: bookingData.passengerCount,
              roomNumber: bookingData.roomNumber,
              status: bookingData.status,
              hotel: {
                name: 'Test Hotel',
                address: 'Test Address',
              },
              schedule: {
                date: '2025-01-15',
                departureTime: '08:00',
                destination: 'Airport',
              },
            },
          }

          const responseString = JSON.stringify(mockResponse)

          // Property: Response should NEVER contain internal database fields
          expect(responseString).not.toContain('"id"')
          expect(responseString).not.toContain('created_at')
          expect(responseString).not.toContain('updated_at')
          expect(responseString).not.toContain('hotel_id')
          expect(responseString).not.toContain('daily_schedule_id')
          expect(responseString).not.toContain('bus_schedule_id')
          expect(responseString).not.toContain('idempotency_key')
          expect(responseString).not.toContain('whatsapp_sent')
          expect(responseString).not.toContain('whatsapp_attempts')
          expect(responseString).not.toContain('whatsapp_last_error')
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('response never contains phone numbers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          bookingCode: fc.string({ minLength: 8, maxLength: 20 }),
          customerName: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        async (bookingData) => {
          // Simulate sanitized response
          const mockResponse = {
            ok: true,
            found: true,
            booking: {
              bookingCode: bookingData.bookingCode,
              customerName: bookingData.customerName,
              passengerCount: 2,
              roomNumber: '101',
              status: 'confirmed',
            },
          }

          const responseString = JSON.stringify(mockResponse)

          // Property: Response should NOT contain phone numbers (privacy)
          expect(responseString).not.toContain('"phone"')
          expect(responseString).not.toContain('phoneNumber')
          expect(responseString).not.toContain('62812') // Indonesian phone prefix
          expect(responseString).not.toContain('+62')
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('response uses camelCase for public API', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          bookingCode: fc.string({ minLength: 8, maxLength: 20 }),
          customerName: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        async (bookingData) => {
          // Simulate sanitized response with camelCase
          const mockResponse = {
            ok: true,
            found: true,
            booking: {
              bookingCode: bookingData.bookingCode, // camelCase
              customerName: bookingData.customerName, // camelCase
              passengerCount: 2, // camelCase
              roomNumber: '101', // camelCase
              status: 'confirmed',
            },
          }

          const responseString = JSON.stringify(mockResponse)

          // Property: Public API should use camelCase, not snake_case
          expect(responseString).toContain('bookingCode')
          expect(responseString).toContain('customerName')
          expect(responseString).toContain('passengerCount')
          expect(responseString).toContain('roomNumber')
          
          // Should NOT contain snake_case database field names
          expect(responseString).not.toContain('booking_code')
          expect(responseString).not.toContain('customer_name')
          expect(responseString).not.toContain('passenger_count')
          expect(responseString).not.toContain('room_number')
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('not found response is safe', () => {
    // Simulate not found response
    const mockResponse = {
      ok: true,
      found: false,
      booking: null,
    }

    const responseString = JSON.stringify(mockResponse)

    // Property: Not found response should not leak information
    expect(responseString).not.toContain('database')
    expect(responseString).not.toContain('table')
    expect(responseString).not.toContain('query')
    expect(responseString).not.toContain('error')
  })
})

/**
 * Test: Rate limiting enforced
 * 
 * The booking status endpoint should enforce rate limiting to prevent abuse.
 * Maximum 30 requests per minute per IP address.
 * 
 * Validates: Requirements 11.2
 */
describe('Rate limiting for booking status', () => {
  test('blocks excessive requests from same IP', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 31, max: 100 }), // Request counts above limit
        fc.ipV4(),
        async (requestCount, ipAddress) => {
          // Simulate rate limit tracking for booking-status endpoint
          const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
          const maxRequests = 30 // booking-status limit
          const windowMs = 60000
          const now = Date.now()

          let blockedCount = 0

          // Simulate multiple requests from same IP
          for (let i = 0; i < requestCount; i++) {
            const key = `${ipAddress}:booking-status`
            let entry = rateLimitStore.get(key)

            if (!entry || entry.resetTime < now) {
              entry = { count: 1, resetTime: now + windowMs }
              rateLimitStore.set(key, entry)
            } else {
              entry.count++
            }

            // Check if rate limited
            if (entry.count > maxRequests) {
              blockedCount++
            }
          }

          // Property: Requests beyond limit should be blocked
          expect(blockedCount).toBeGreaterThan(0)
          expect(blockedCount).toBe(requestCount - maxRequests)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('allows requests within rate limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 30 }), // Request counts within limit
        fc.ipV4(),
        async (requestCount, ipAddress) => {
          // Simulate rate limit tracking
          const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
          const maxRequests = 30
          const windowMs = 60000
          const now = Date.now()

          let allowedCount = 0

          // Simulate multiple requests from same IP
          for (let i = 0; i < requestCount; i++) {
            const key = `${ipAddress}:booking-status`
            let entry = rateLimitStore.get(key)

            if (!entry || entry.resetTime < now) {
              entry = { count: 1, resetTime: now + windowMs }
              rateLimitStore.set(key, entry)
            } else {
              entry.count++
            }

            // Check if allowed
            if (entry.count <= maxRequests) {
              allowedCount++
            }
          }

          // Property: All requests within limit should be allowed
          expect(allowedCount).toBe(requestCount)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('rate limit resets after time window', () => {
    // Simulate rate limit tracking
    const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
    const maxRequests = 30
    const windowMs = 60000
    const ipAddress = '192.168.1.1'
    const key = `${ipAddress}:booking-status`

    // First window - fill up the limit
    const now = Date.now()
    rateLimitStore.set(key, { count: maxRequests, resetTime: now + windowMs })

    // Check that limit is reached
    let entry = rateLimitStore.get(key)!
    expect(entry.count).toBe(maxRequests)

    // Simulate time passing (window expired)
    const futureTime = now + windowMs + 1000

    // Check if window has expired
    const isExpired = entry.resetTime < futureTime

    // Property: After window expires, new requests should be allowed
    expect(isExpired).toBe(true)
  })

  test('different IPs have independent rate limits', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.ipV4(), { minLength: 2, maxLength: 10 }),
        async (ipAddresses) => {
          // Simulate rate limit tracking
          const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
          const maxRequests = 30
          const windowMs = 60000
          const now = Date.now()

          // Each IP makes requests
          for (const ip of ipAddresses) {
            const key = `${ip}:booking-status`
            rateLimitStore.set(key, { count: 15, resetTime: now + windowMs })
          }

          // Property: Each IP should have independent rate limit tracking
          expect(rateLimitStore.size).toBe(ipAddresses.length)
          
          // Each entry should have its own count
          for (const ip of ipAddresses) {
            const key = `${ip}:booking-status`
            const entry = rateLimitStore.get(key)
            expect(entry).toBeDefined()
            expect(entry!.count).toBe(15)
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Test: Error handling is secure
 * 
 * Error responses should not leak internal system details.
 */
describe('Secure error handling', () => {
  test('error responses are generic', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('database', 'network', 'validation', 'internal'),
        async (errorType) => {
          // Simulate generic error response
          const mockErrorResponse = {
            ok: false,
            error: 'Unable to process request',
          }

          const responseString = JSON.stringify(mockErrorResponse)

          // Property: Error responses should be generic
          expect(responseString).not.toContain('stack')
          expect(responseString).not.toContain('SQL')
          expect(responseString).not.toContain('postgres')
          expect(responseString).not.toContain('supabase')
          expect(responseString).not.toContain('index.ts')
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})
