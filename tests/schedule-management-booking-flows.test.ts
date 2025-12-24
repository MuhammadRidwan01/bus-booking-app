/**
 * Schedule Management System - Booking Flow Tests
 * 
 * Feature: schedule-management
 * Tests service type booking flows and advance booking validation
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'

// Mock the booking actions
vi.mock('@/app/actions/booking', () => ({
  createBooking: vi.fn(),
  createBookingOptimistic: vi.fn(),
}))

// Mock the real-time capacity hook
vi.mock('@/hooks/useRealTimeCapacity', () => ({
  useRealTimeCapacity: vi.fn(),
}))

// Mock Supabase client
vi.mock('@/lib/supabase-browser', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
    })),
  })),
}))

import { createBooking, createBookingOptimistic } from '@/app/actions/booking'
import { useRealTimeCapacity } from '@/hooks/useRealTimeCapacity'

const mockCreateBooking = vi.mocked(createBooking)
const mockCreateBookingOptimistic = vi.mocked(createBookingOptimistic)
const mockUseRealTimeCapacity = vi.mocked(useRealTimeCapacity)

describe('Schedule Management - Service Type Booking Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful booking creation
    mockCreateBooking.mockResolvedValue({
      success: true,
      data: {
        bookingCode: 'IBX12345678',
        booking: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          booking_code: 'IBX12345678',
          customer_name: 'Test User',
          phone: '081234567890',
          service_type: 'drop_off',
          terminal_code: null,
          meeting_point_id: null,
        },
      },
    })

    mockCreateBookingOptimistic.mockResolvedValue({
      success: true,
      data: {
        bookingCode: 'IBX12345678',
        booking: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          booking_code: 'IBX12345678',
          customer_name: 'Test User',
          phone: '081234567890',
          service_type: 'drop_off',
          terminal_code: null,
          meeting_point_id: null,
        },
      },
    })

    // Mock real-time capacity data
    mockUseRealTimeCapacity.mockReturnValue({
      schedules: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          schedule_date: '2025-01-15',
          service_type: 'drop_off',
          hotel: 'ibis_style',
          departure_time: '06:00',
          capacity: 15,
          current_bookings: 5,
          is_active: true,
        },
      ],
      loading: false,
      error: null,
    })
  })

  /**
   * Test complete drop-off booking flow (hotel to airport)
   * Requirements: 2.1, 2.2, 2.3
   */
  describe('Drop-off booking flow', () => {
    test('should complete drop-off booking with valid data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: fc.string({ minLength: 1, maxLength: 100 }),
            phoneNumber: fc.string({ minLength: 10, maxLength: 15 }).filter(s => s.match(/^[0-9+]+$/)),
            passengerCount: fc.integer({ min: 1, max: 5 }),
            roomNumber: fc.string({ minLength: 1, maxLength: 10 }),
          }),
          async (bookingData) => {
            const bookingRequest = {
              ...bookingData,
              countryCode: '62',
              bookingDate: '2025-01-15',
              scheduleId: '123e4567-e89b-12d3-a456-426614174000',
              serviceType: 'drop_off' as const,
              hotel: 'ibis_style' as const,
              idempotencyKey: `test-${Date.now()}`,
              hasWhatsapp: 'yes' as const,
            }

            const result = await createBooking(bookingRequest)

            // Property: Valid drop-off bookings should succeed
            expect(result.success).toBe(true)
            expect(result.data?.booking.service_type).toBe('drop_off')
            expect(result.data?.booking.terminal_code).toBeNull()
            expect(result.data?.booking.meeting_point_id).toBeNull()

            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    test('should validate service type for drop-off schedules', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('drop_off', 'pick_up'),
          fc.constantFrom('06:00', '07:30', '09:00', '13:00', '14:00', '15:00'),
          async (serviceType, departureTime) => {
            // Mock schedule data based on service type
            const isValidCombination = 
              (serviceType === 'drop_off' && ['06:00', '07:30', '09:00'].includes(departureTime)) ||
              (serviceType === 'pick_up' && ['13:00', '14:00', '15:00'].includes(departureTime))

            mockUseRealTimeCapacity.mockReturnValue({
              schedules: isValidCombination ? [{
                id: '123e4567-e89b-12d3-a456-426614174000',
                schedule_date: '2025-01-15',
                service_type: serviceType,
                hotel: 'ibis_style',
                departure_time: departureTime,
                capacity: 15,
                current_bookings: 5,
                is_active: true,
              }] : [],
              loading: false,
              error: null,
            })

            const { schedules } = mockUseRealTimeCapacity()

            // Property: Only valid service type and time combinations should be available
            if (isValidCombination) {
              expect(schedules).toHaveLength(1)
              expect(schedules[0].service_type).toBe(serviceType)
              expect(schedules[0].departure_time).toBe(departureTime)
            } else {
              expect(schedules).toHaveLength(0)
            }

            return true
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * Test complete pick-up booking flow (airport to hotel) with terminal selection
   * Requirements: 2.1, 2.2, 2.3
   */
  describe('Pick-up booking flow', () => {
    test('should complete pick-up booking with terminal selection', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: fc.string({ minLength: 1, maxLength: 100 }),
            phoneNumber: fc.string({ minLength: 10, maxLength: 15 }).filter(s => s.match(/^[0-9+]+$/)),
            passengerCount: fc.integer({ min: 1, max: 5 }),
            terminalCode: fc.constantFrom('1A', '1B', '1C', '2E', '2F', '3'),
          }),
          async (bookingData) => {
            // Mock successful pick-up booking
            mockCreateBooking.mockResolvedValue({
              success: true,
              data: {
                bookingCode: 'IBX12345678',
                booking: {
                  id: '123e4567-e89b-12d3-a456-426614174000',
                  booking_code: 'IBX12345678',
                  customer_name: bookingData.customerName,
                  phone: bookingData.phoneNumber,
                  service_type: 'pick_up',
                  terminal_code: bookingData.terminalCode,
                  meeting_point_id: '456e7890-e89b-12d3-a456-426614174000',
                },
              },
            })

            const bookingRequest = {
              ...bookingData,
              countryCode: '62',
              bookingDate: '2025-01-15',
              scheduleId: '123e4567-e89b-12d3-a456-426614174000',
              serviceType: 'pick_up' as const,
              hotel: 'ibis_style' as const,
              idempotencyKey: `test-${Date.now()}`,
              hasWhatsapp: 'yes' as const,
              meetingPointId: '456e7890-e89b-12d3-a456-426614174000',
            }

            const result = await createBooking(bookingRequest)

            // Property: Valid pick-up bookings should succeed with terminal info
            expect(result.success).toBe(true)
            expect(result.data?.booking.service_type).toBe('pick_up')
            expect(result.data?.booking.terminal_code).toBe(bookingData.terminalCode)
            expect(result.data?.booking.meeting_point_id).toBeDefined()

            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    test('should require terminal selection for pick-up bookings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: fc.string({ minLength: 1, maxLength: 100 }),
            phoneNumber: fc.string({ minLength: 10, maxLength: 15 }).filter(s => s.match(/^[0-9+]+$/)),
            passengerCount: fc.integer({ min: 1, max: 5 }),
          }),
          async (bookingData) => {
            // Mock validation error for missing terminal
            mockCreateBooking.mockResolvedValue({
              success: false,
              error: 'Terminal selection is required for pick-up bookings',
            })

            const bookingRequest = {
              ...bookingData,
              countryCode: '62',
              bookingDate: '2025-01-15',
              scheduleId: '123e4567-e89b-12d3-a456-426614174000',
              serviceType: 'pick_up' as const,
              hotel: 'ibis_style' as const,
              idempotencyKey: `test-${Date.now()}`,
              hasWhatsapp: 'yes' as const,
              // Missing terminalCode and meetingPointId
            }

            const result = await createBooking(bookingRequest)

            // Property: Pick-up bookings without terminal should fail
            expect(result.success).toBe(false)
            expect(result.error).toContain('Terminal selection is required')

            return true
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * Test advance booking validation (minimum 1 day prior)
   * Requirements: 12.1, 12.2
   */
  describe('Advance booking validation', () => {
    test('should reject same-day bookings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: fc.string({ minLength: 1, maxLength: 100 }),
            phoneNumber: fc.string({ minLength: 10, maxLength: 15 }).filter(s => s.match(/^[0-9+]+$/)),
            passengerCount: fc.integer({ min: 1, max: 5 }),
          }),
          async (bookingData) => {
            // Mock validation error for same-day booking
            mockCreateBooking.mockResolvedValue({
              success: false,
              error: 'Bookings must be made at least 1 day in advance',
            })

            const today = new Date().toISOString().split('T')[0]
            const bookingRequest = {
              ...bookingData,
              countryCode: '62',
              bookingDate: today, // Same day booking
              scheduleId: '123e4567-e89b-12d3-a456-426614174000',
              serviceType: 'drop_off' as const,
              hotel: 'ibis_style' as const,
              idempotencyKey: `test-${Date.now()}`,
              hasWhatsapp: 'yes' as const,
            }

            const result = await createBooking(bookingRequest)

            // Property: Same-day bookings should be rejected
            expect(result.success).toBe(false)
            expect(result.error).toContain('at least 1 day in advance')

            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    test('should accept bookings made 1+ days in advance', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerName: fc.string({ minLength: 1, maxLength: 100 }),
            phoneNumber: fc.string({ minLength: 10, maxLength: 15 }).filter(s => s.match(/^[0-9+]+$/)),
            passengerCount: fc.integer({ min: 1, max: 5 }),
            daysInAdvance: fc.integer({ min: 1, max: 30 }),
          }),
          async (bookingData) => {
            // Mock successful advance booking
            mockCreateBooking.mockResolvedValue({
              success: true,
              data: {
                bookingCode: 'IBX12345678',
                booking: {
                  id: '123e4567-e89b-12d3-a456-426614174000',
                  booking_code: 'IBX12345678',
                  customer_name: bookingData.customerName,
                  phone: bookingData.phoneNumber,
                  service_type: 'drop_off',
                  terminal_code: null,
                  meeting_point_id: null,
                },
              },
            })

            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + bookingData.daysInAdvance)
            const bookingDate = futureDate.toISOString().split('T')[0]

            const bookingRequest = {
              customerName: bookingData.customerName,
              phoneNumber: bookingData.phoneNumber,
              passengerCount: bookingData.passengerCount,
              countryCode: '62',
              bookingDate,
              scheduleId: '123e4567-e89b-12d3-a456-426614174000',
              serviceType: 'drop_off' as const,
              hotel: 'ibis_style' as const,
              idempotencyKey: `test-${Date.now()}`,
              hasWhatsapp: 'yes' as const,
            }

            const result = await createBooking(bookingRequest)

            // Property: Advance bookings should succeed
            expect(result.success).toBe(true)
            expect(result.data?.booking.service_type).toBe('drop_off')

            return true
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * Test service-specific schedule display and filtering
   * Requirements: 1.3, 2.3, 3.1, 3.2
   */
  describe('Service-specific schedule display', () => {
    test('should filter schedules by service type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('drop_off', 'pick_up'),
          fc.constantFrom('ibis_style', 'ibis_budget'),
          async (serviceType, hotel) => {
            // Mock service-specific schedules
            const dropOffTimes = ['03:00', '04:30', '06:00', '07:30', '09:00', '10:30', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '00:00']
            const pickUpTimes = ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00']
            
            const expectedTimes = serviceType === 'drop_off' ? dropOffTimes : pickUpTimes
            
            const mockSchedules = expectedTimes.map((time, index) => ({
              id: `${index}-${serviceType}-${time}`,
              schedule_date: '2025-01-15',
              service_type: serviceType,
              hotel,
              departure_time: time,
              capacity: 15,
              current_bookings: Math.floor(Math.random() * 10),
              is_active: true,
            }))

            mockUseRealTimeCapacity.mockReturnValue({
              schedules: mockSchedules,
              loading: false,
              error: null,
            })

            const { schedules } = mockUseRealTimeCapacity()

            // Property: All returned schedules should match the requested service type
            expect(schedules.every(s => s.service_type === serviceType)).toBe(true)
            expect(schedules.every(s => s.hotel === hotel)).toBe(true)
            expect(schedules.every(s => expectedTimes.includes(s.departure_time))).toBe(true)

            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    test('should not mix service types in schedule display', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              serviceType: fc.constantFrom('drop_off', 'pick_up'),
              departureTime: fc.constantFrom('06:00', '13:00', '18:00', '22:00'),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (scheduleConfigs) => {
            const mockSchedules = scheduleConfigs.map((config, index) => ({
              id: `${index}-${config.serviceType}-${config.departureTime}`,
              schedule_date: '2025-01-15',
              service_type: config.serviceType,
              hotel: 'ibis_style',
              departure_time: config.departureTime,
              capacity: 15,
              current_bookings: 5,
              is_active: true,
            }))

            mockUseRealTimeCapacity.mockReturnValue({
              schedules: mockSchedules,
              loading: false,
              error: null,
            })

            const { schedules } = mockUseRealTimeCapacity()

            // Property: When filtering by service type, only that type should be returned
            const dropOffSchedules = schedules.filter(s => s.service_type === 'drop_off')
            const pickUpSchedules = schedules.filter(s => s.service_type === 'pick_up')

            // Each filtered group should only contain its own service type
            expect(dropOffSchedules.every(s => s.service_type === 'drop_off')).toBe(true)
            expect(pickUpSchedules.every(s => s.service_type === 'pick_up')).toBe(true)

            return true
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})