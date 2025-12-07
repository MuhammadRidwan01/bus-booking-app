/**
 * Integration Tests for Frontend-to-Edge-Function Flow
 * 
 * Feature: database-security
 * Tests the integration between frontend services and Edge Functions
 * 
 * Validates: Requirements 6.1, 6.2, 10.1, 10.2
 */

import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest'

// Set up environment variables before any imports
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Mock Supabase client
vi.mock('@/lib/supabase-browser', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-jwt-token',
            user: { id: 'test-user-id' },
          },
        },
      }),
    },
  },
}))

// Now import the modules that depend on environment variables
import { createBooking, getBookingStatus, createAdminBooking } from '@/lib/booking-service'

// Mock fetch globally
global.fetch = vi.fn()

describe('Frontend-to-Edge-Function Integration Tests', () => {
  beforeAll(() => {
    // Ensure environment variables are set
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Booking Creation Flow', () => {
    test('createBooking sends correct request to Edge Function', async () => {
      // Mock successful response
      const mockResponse = {
        ok: true,
        data: {
          bookingCode: 'IBX1A2B3C4D',
          booking: {
            booking_code: 'IBX1A2B3C4D',
            customer_name: 'Test User',
            status: 'confirmed',
          },
        },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const bookingData = {
        customerName: 'Test User',
        phoneNumber: '081234567890',
        countryCode: '62',
        bookingDate: '2025-01-15',
        scheduleId: '123e4567-e89b-12d3-a456-426614174000',
        passengerCount: 2,
        roomNumber: '101',
        idempotencyKey: 'test-key-123',
        hasWhatsapp: 'yes' as const,
      }

      const result = await createBooking(bookingData)

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledTimes(1)
      const fetchCall = (global.fetch as any).mock.calls[0]
      
      expect(fetchCall[0]).toBe('https://test.supabase.co/functions/v1/booking')
      expect(fetchCall[1].method).toBe('POST')
      expect(fetchCall[1].headers['Content-Type']).toBe('application/json')
      expect(fetchCall[1].headers['Authorization']).toBeDefined()
      
      const requestBody = JSON.parse(fetchCall[1].body)
      expect(requestBody.customerName).toBe('Test User')
      expect(requestBody.phoneNumber).toBe('081234567890')
      expect(requestBody.passengerCount).toBe(2)

      // Verify result
      expect(result.ok).toBe(true)
      expect(result.data?.bookingCode).toBe('IBX1A2B3C4D')
    })

    test('createBooking includes JWT token in Authorization header', async () => {
      const mockResponse = {
        ok: true,
        data: { bookingCode: 'IBX1A2B3C4D', booking: {} },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const bookingData = {
        customerName: 'Test User',
        phoneNumber: '081234567890',
        countryCode: '62',
        bookingDate: '2025-01-15',
        scheduleId: '123e4567-e89b-12d3-a456-426614174000',
        passengerCount: 2,
        roomNumber: '101',
        idempotencyKey: 'test-key-123',
        hasWhatsapp: 'yes' as const,
      }

      await createBooking(bookingData)

      const fetchCall = (global.fetch as any).mock.calls[0]
      const authHeader = fetchCall[1].headers['Authorization']
      
      // Verify JWT token format (Bearer token)
      expect(authHeader).toMatch(/^Bearer /)
      
      // Validates: Requirements 6.1, 6.2
    })

    test('createBooking handles Edge Function errors gracefully', async () => {
      const mockErrorResponse = {
        ok: false,
        error: 'Unable to process request',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
      })

      const bookingData = {
        customerName: 'Test User',
        phoneNumber: '081234567890',
        countryCode: '62',
        bookingDate: '2025-01-15',
        scheduleId: '123e4567-e89b-12d3-a456-426614174000',
        passengerCount: 2,
        roomNumber: '101',
        idempotencyKey: 'test-key-123',
        hasWhatsapp: 'yes' as const,
      }

      const result = await createBooking(bookingData)

      expect(result.ok).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).not.toContain('stack')
      expect(result.error).not.toContain('SQL')
    })

    test('createBooking handles network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const bookingData = {
        customerName: 'Test User',
        phoneNumber: '081234567890',
        countryCode: '62',
        bookingDate: '2025-01-15',
        scheduleId: '123e4567-e89b-12d3-a456-426614174000',
        passengerCount: 2,
        roomNumber: '101',
        idempotencyKey: 'test-key-123',
        hasWhatsapp: 'yes' as const,
      }

      const result = await createBooking(bookingData)

      expect(result.ok).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('Booking Status Retrieval Flow', () => {
    test('getBookingStatus sends correct request to Edge Function', async () => {
      const mockResponse = {
        ok: true,
        found: true,
        booking: {
          booking_code: 'IBX1A2B3C4D',
          customer_name: 'Test User',
          status: 'confirmed',
        },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await getBookingStatus('IBX1A2B3C4D')

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledTimes(1)
      const fetchCall = (global.fetch as any).mock.calls[0]
      
      expect(fetchCall[0]).toContain('/functions/v1/booking-status')
      expect(fetchCall[0]).toContain('code=IBX1A2B3C4D')
      expect(fetchCall[1].method).toBe('GET')

      // Verify result
      expect(result.ok).toBe(true)
      expect(result.found).toBe(true)
      expect(result.booking?.booking_code).toBe('IBX1A2B3C4D')
      
      // Validates: Requirements 10.1
    })

    test('getBookingStatus works without JWT token (public access)', async () => {
      const mockResponse = {
        ok: true,
        found: true,
        booking: { booking_code: 'IBX1A2B3C4D' },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await getBookingStatus('IBX1A2B3C4D')

      const fetchCall = (global.fetch as any).mock.calls[0]
      const headers = fetchCall[1].headers
      
      // Authorization header is optional for public access
      // If present, it should be properly formatted
      if (headers['Authorization']) {
        expect(headers['Authorization']).toMatch(/^Bearer /)
      }
      
      // Validates: Requirements 6.3 (public access)
    })

    test('getBookingStatus handles not found gracefully', async () => {
      const mockResponse = {
        ok: true,
        found: false,
        booking: null,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await getBookingStatus('INVALID')

      expect(result.ok).toBe(true)
      expect(result.found).toBe(false)
      expect(result.booking).toBeNull()
    })

    test('getBookingStatus encodes booking code properly', async () => {
      const mockResponse = {
        ok: true,
        found: true,
        booking: {},
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      // Test with special characters
      await getBookingStatus('IBX+TEST/CODE')

      const fetchCall = (global.fetch as any).mock.calls[0]
      const url = fetchCall[0]
      
      // Verify URL encoding
      expect(url).toContain('code=IBX%2BTEST%2FCODE')
    })
  })

  describe('Admin Booking Flow', () => {
    test('createAdminBooking sends correct request to Edge Function', async () => {
      const mockResponse = {
        ok: true,
        data: {
          booking_code: 'IBX1A2B3C4D',
          customer_name: 'Admin Test User',
          status: 'confirmed',
        },
        whatsappSent: true,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const adminBookingData = {
        hotelId: '123e4567-e89b-12d3-a456-426614174000',
        dailyScheduleId: '123e4567-e89b-12d3-a456-426614174001',
        customerName: 'Admin Test User',
        phoneNumber: '081234567890',
        passengerCount: 3,
        roomNumber: '202',
      }

      const result = await createAdminBooking(adminBookingData)

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledTimes(1)
      const fetchCall = (global.fetch as any).mock.calls[0]
      
      expect(fetchCall[0]).toBe('https://test.supabase.co/functions/v1/admin-booking')
      expect(fetchCall[1].method).toBe('POST')
      expect(fetchCall[1].headers['Content-Type']).toBe('application/json')
      expect(fetchCall[1].headers['Authorization']).toBeDefined()
      
      const requestBody = JSON.parse(fetchCall[1].body)
      expect(requestBody.customerName).toBe('Admin Test User')
      expect(requestBody.hotelId).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(requestBody.passengerCount).toBe(3)

      // Verify result
      expect(result.ok).toBe(true)
      expect(result.data?.customer_name).toBe('Admin Test User')
      expect(result.whatsappSent).toBe(true)
      
      // Validates: Requirements 10.2
    })

    test('createAdminBooking includes admin JWT token', async () => {
      const mockResponse = {
        ok: true,
        data: {},
        whatsappSent: true,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const adminBookingData = {
        hotelId: '123e4567-e89b-12d3-a456-426614174000',
        dailyScheduleId: '123e4567-e89b-12d3-a456-426614174001',
        customerName: 'Admin Test User',
        phoneNumber: '081234567890',
        passengerCount: 3,
        roomNumber: '202',
      }

      await createAdminBooking(adminBookingData)

      const fetchCall = (global.fetch as any).mock.calls[0]
      const authHeader = fetchCall[1].headers['Authorization']
      
      // Verify admin JWT token format
      expect(authHeader).toMatch(/^Bearer /)
      
      // Validates: Requirements 10.2 (admin authentication)
    })

    test('createAdminBooking handles authorization errors', async () => {
      const mockErrorResponse = {
        ok: false,
        error: 'Access denied',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => mockErrorResponse,
      })

      const adminBookingData = {
        hotelId: '123e4567-e89b-12d3-a456-426614174000',
        dailyScheduleId: '123e4567-e89b-12d3-a456-426614174001',
        customerName: 'Admin Test User',
        phoneNumber: '081234567890',
        passengerCount: 3,
        roomNumber: '202',
      }

      const result = await createAdminBooking(adminBookingData)

      expect(result.ok).toBe(false)
      expect(result.error).toBe('Access denied')
    })
  })

  describe('JWT Token Handling', () => {
    test('all service functions include JWT tokens when available', async () => {
      const mockResponse = { ok: true, data: {} }

      // Test createBooking
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await createBooking({
        customerName: 'Test',
        phoneNumber: '081234567890',
        countryCode: '62',
        bookingDate: '2025-01-15',
        scheduleId: '123e4567-e89b-12d3-a456-426614174000',
        passengerCount: 1,
        roomNumber: '101',
        idempotencyKey: 'test-key',
        hasWhatsapp: 'yes',
      })

      let fetchCall = (global.fetch as any).mock.calls[0]
      expect(fetchCall[1].headers['Authorization']).toBeDefined()

      // Test getBookingStatus
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, found: true, booking: {} }),
      })

      await getBookingStatus('IBX1A2B3C4D')

      fetchCall = (global.fetch as any).mock.calls[1]
      // Authorization is optional for getBookingStatus but should be included if available
      expect(fetchCall[1].headers).toBeDefined()

      // Test createAdminBooking
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await createAdminBooking({
        hotelId: '123e4567-e89b-12d3-a456-426614174000',
        dailyScheduleId: '123e4567-e89b-12d3-a456-426614174001',
        customerName: 'Admin Test',
        phoneNumber: '081234567890',
        passengerCount: 1,
        roomNumber: '101',
      })

      fetchCall = (global.fetch as any).mock.calls[2]
      expect(fetchCall[1].headers['Authorization']).toBeDefined()
      
      // Validates: Requirements 6.1, 6.2
    })

    test('JWT tokens are sent correctly formatted', async () => {
      const mockResponse = { ok: true, data: {} }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await createBooking({
        customerName: 'Test',
        phoneNumber: '081234567890',
        countryCode: '62',
        bookingDate: '2025-01-15',
        scheduleId: '123e4567-e89b-12d3-a456-426614174000',
        passengerCount: 1,
        roomNumber: '101',
        idempotencyKey: 'test-key',
        hasWhatsapp: 'yes',
      })

      const fetchCall = (global.fetch as any).mock.calls[0]
      const authHeader = fetchCall[1].headers['Authorization']
      
      // Verify Bearer token format
      expect(authHeader).toMatch(/^Bearer /)
      
      // Verify it's not empty after "Bearer "
      const token = authHeader.replace('Bearer ', '')
      expect(token.length).toBeGreaterThan(0)
    })
  })

  describe('Error Response Handling', () => {
    test('all service functions handle generic errors without exposing internals', async () => {
      const mockErrorResponse = {
        ok: false,
        error: 'Unable to process request',
      }

      // Test createBooking error handling
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      })

      const bookingResult = await createBooking({
        customerName: 'Test',
        phoneNumber: '081234567890',
        countryCode: '62',
        bookingDate: '2025-01-15',
        scheduleId: '123e4567-e89b-12d3-a456-426614174000',
        passengerCount: 1,
        roomNumber: '101',
        idempotencyKey: 'test-key',
        hasWhatsapp: 'yes',
      })

      expect(bookingResult.ok).toBe(false)
      expect(bookingResult.error).not.toContain('stack')
      expect(bookingResult.error).not.toContain('SQL')
      expect(bookingResult.error).not.toContain('database')

      // Test getBookingStatus error handling
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      })

      const statusResult = await getBookingStatus('IBX1A2B3C4D')

      expect(statusResult.ok).toBe(false)
      expect(statusResult.error).not.toContain('stack')
      expect(statusResult.error).not.toContain('SQL')

      // Test createAdminBooking error handling
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      })

      const adminResult = await createAdminBooking({
        hotelId: '123e4567-e89b-12d3-a456-426614174000',
        dailyScheduleId: '123e4567-e89b-12d3-a456-426614174001',
        customerName: 'Admin Test',
        phoneNumber: '081234567890',
        passengerCount: 1,
        roomNumber: '101',
      })

      expect(adminResult.ok).toBe(false)
      expect(adminResult.error).not.toContain('stack')
      expect(adminResult.error).not.toContain('SQL')
    })
  })

  describe('Environment Variable Usage', () => {
    test('all service functions use NEXT_PUBLIC_SUPABASE_URL environment variable', async () => {
      const mockResponse = { ok: true, data: {} }

      // Test createBooking
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await createBooking({
        customerName: 'Test',
        phoneNumber: '081234567890',
        countryCode: '62',
        bookingDate: '2025-01-15',
        scheduleId: '123e4567-e89b-12d3-a456-426614174000',
        passengerCount: 1,
        roomNumber: '101',
        idempotencyKey: 'test-key',
        hasWhatsapp: 'yes',
      })

      let fetchCall = (global.fetch as any).mock.calls[0]
      expect(fetchCall[0]).toContain(process.env.NEXT_PUBLIC_SUPABASE_URL)
      expect(fetchCall[0]).not.toContain('localhost')
      expect(fetchCall[0]).not.toContain('hardcoded')

      // Test getBookingStatus
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, found: true, booking: {} }),
      })

      await getBookingStatus('IBX1A2B3C4D')

      fetchCall = (global.fetch as any).mock.calls[1]
      expect(fetchCall[0]).toContain(process.env.NEXT_PUBLIC_SUPABASE_URL)

      // Test createAdminBooking
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await createAdminBooking({
        hotelId: '123e4567-e89b-12d3-a456-426614174000',
        dailyScheduleId: '123e4567-e89b-12d3-a456-426614174001',
        customerName: 'Admin Test',
        phoneNumber: '081234567890',
        passengerCount: 1,
        roomNumber: '101',
      })

      fetchCall = (global.fetch as any).mock.calls[2]
      expect(fetchCall[0]).toContain(process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      // Validates: Requirements 12.2 (environment variables for endpoints)
    })
  })
})
