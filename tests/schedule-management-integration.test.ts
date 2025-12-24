/**
 * Schedule Management System - Integration Tests
 * 
 * Feature: schedule-management
 * Tests end-to-end booking flows, real-time capacity management, and admin interface
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables for integration tests')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

describe('Schedule Management - Integration Tests', () => {
  let testScheduleId: string
  let testBookingCode: string
  let testMeetingPointId: string

  beforeAll(async () => {
    // Set up test data
    console.log('Setting up integration test data...')
    
    // Create a test schedule for tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Insert test daily schedule for drop-off
    const { data: dropOffSchedule, error: dropOffError } = await supabase
      .from('daily_schedules')
      .insert({
        schedule_date: tomorrowStr,
        service_type: 'drop_off',
        hotel: 'ibis_style',
        departure_time: '06:00',
        capacity: 15,
        current_bookings: 0,
        is_active: true
      })
      .select()
      .single()

    if (dropOffError) {
      console.error('Error creating test drop-off schedule:', dropOffError)
    } else {
      testScheduleId = dropOffSchedule.id
      console.log('Created test drop-off schedule:', testScheduleId)
    }

    // Insert test daily schedule for pick-up
    const { data: pickUpSchedule, error: pickUpError } = await supabase
      .from('daily_schedules')
      .insert({
        schedule_date: tomorrowStr,
        service_type: 'pick_up',
        hotel: 'ibis_style',
        departure_time: '13:00',
        capacity: 15,
        current_bookings: 0,
        is_active: true
      })
      .select()
      .single()

    if (pickUpError) {
      console.error('Error creating test pick-up schedule:', pickUpError)
    }

    // Get a test meeting point
    const { data: meetingPoint, error: meetingPointError } = await supabase
      .from('terminal_meeting_points')
      .select('id')
      .eq('terminal_code', '1A')
      .single()

    if (meetingPointError) {
      console.error('Error getting test meeting point:', meetingPointError)
    } else {
      testMeetingPointId = meetingPoint.id
    }
  })

  afterAll(async () => {
    // Clean up test data
    console.log('Cleaning up integration test data...')
    
    if (testBookingCode) {
      await supabase
        .from('bookings')
        .delete()
        .eq('booking_code', testBookingCode)
    }

    if (testScheduleId) {
      await supabase
        .from('daily_schedules')
        .delete()
        .eq('id', testScheduleId)
    }
  })

  /**
   * Test 8.1.1: End-to-end drop-off booking flow
   * Requirements: 2.1, 2.2, 2.3
   */
  test('should complete end-to-end drop-off booking flow', async () => {
    // Test data
    const bookingData = {
      customerName: 'Integration Test User',
      phoneNumber: '081234567890',
      passengerCount: 2,
      flightNumber: 'GA123',
      serviceType: 'drop_off',
      scheduleId: testScheduleId,
      hasWhatsapp: 'yes',
      countryCode: '62'
    }

    // Create FormData as expected by the booking action
    const formData = new FormData()
    Object.entries(bookingData).forEach(([key, value]) => {
      formData.append(key, value.toString())
    })
    formData.append('idempotencyKey', `test-${Date.now()}`)
    formData.append('bookingDate', new Date().toISOString().split('T')[0])

    // Call the booking edge function directly
    const response = await fetch(`${supabaseUrl}/functions/v1/booking`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      },
      body: JSON.stringify({
        ...bookingData,
        idempotencyKey: `test-${Date.now()}`,
        bookingDate: new Date().toISOString().split('T')[0]
      })
    })

    const result = await response.json()

    // Verify booking was created successfully
    expect(response.ok).toBe(true)
    expect(result.ok).toBe(true)
    expect(result.data.bookingCode).toBeDefined()
    expect(result.data.bookingCode).toMatch(/^IBX\d{8}$/)

    testBookingCode = result.data.bookingCode

    // Verify booking exists in database
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_code', testBookingCode)
      .single()

    expect(error).toBeNull()
    expect(booking).toBeDefined()
    expect(booking.service_type).toBe('drop_off')
    expect(booking.terminal_code).toBeNull()
    expect(booking.meeting_point_id).toBeNull()
  }, 30000)

  /**
   * Test 8.1.2: End-to-end pick-up booking flow with terminal selection
   * Requirements: 2.1, 2.2, 2.3, 11.1
   */
  test('should complete end-to-end pick-up booking flow with terminal selection', async () => {
    // Get pick-up schedule
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const { data: pickUpSchedule } = await supabase
      .from('daily_schedules')
      .select('id')
      .eq('schedule_date', tomorrowStr)
      .eq('service_type', 'pick_up')
      .eq('departure_time', '13:00')
      .single()

    if (!pickUpSchedule) {
      console.warn('No pick-up schedule found, skipping test')
      return
    }

    const bookingData = {
      customerName: 'Integration Test Pickup User',
      phoneNumber: '081234567891',
      passengerCount: 1,
      flightNumber: 'GA456',
      serviceType: 'pick_up',
      scheduleId: pickUpSchedule.id,
      terminalCode: '1A',
      meetingPointId: testMeetingPointId,
      hasWhatsapp: 'yes',
      countryCode: '62'
    }

    // Call the booking edge function directly
    const response = await fetch(`${supabaseUrl}/functions/v1/booking`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      },
      body: JSON.stringify({
        ...bookingData,
        idempotencyKey: `test-pickup-${Date.now()}`,
        bookingDate: tomorrowStr
      })
    })

    const result = await response.json()

    // Verify booking was created successfully
    expect(response.ok).toBe(true)
    expect(result.ok).toBe(true)
    expect(result.data.bookingCode).toBeDefined()

    const pickupBookingCode = result.data.bookingCode

    // Verify booking exists in database with terminal info
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_code', pickupBookingCode)
      .single()

    expect(error).toBeNull()
    expect(booking).toBeDefined()
    expect(booking.service_type).toBe('pick_up')
    expect(booking.terminal_code).toBe('1A')
    expect(booking.meeting_point_id).toBe(testMeetingPointId)

    // Clean up
    await supabase
      .from('bookings')
      .delete()
      .eq('booking_code', pickupBookingCode)
  }, 30000)

  /**
   * Test 8.1.3: Real-time capacity management across services
   * Requirements: 3.3, 4.3
   */
  test('should manage real-time capacity updates for both service types', async () => {
    // Get current capacity for both service types
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const { data: schedules, error } = await supabase
      .from('daily_schedules')
      .select('*')
      .eq('schedule_date', tomorrowStr)
      .eq('hotel', 'ibis_style')
      .in('service_type', ['drop_off', 'pick_up'])

    expect(error).toBeNull()
    expect(schedules).toBeDefined()
    expect(schedules.length).toBeGreaterThan(0)

    // Verify service types are properly separated
    const dropOffSchedules = schedules.filter(s => s.service_type === 'drop_off')
    const pickUpSchedules = schedules.filter(s => s.service_type === 'pick_up')

    expect(dropOffSchedules.length).toBeGreaterThan(0)
    expect(pickUpSchedules.length).toBeGreaterThan(0)

    // Test capacity tracking is independent
    for (const schedule of schedules) {
      expect(schedule.current_bookings).toBeGreaterThanOrEqual(0)
      expect(schedule.capacity).toBeGreaterThan(0)
      expect(schedule.current_bookings).toBeLessThanOrEqual(schedule.capacity)
    }
  })

  /**
   * Test 8.1.4: Admin interface with live data
   * Requirements: 4.3, 8.1
   */
  test('should provide admin interface access to schedule data', async () => {
    // Test admin access to schedule templates
    const { data: templates, error: templatesError } = await supabase
      .from('schedule_templates')
      .select('*')
      .eq('is_active', true)

    expect(templatesError).toBeNull()
    expect(templates).toBeDefined()

    // Verify both service types have templates
    const dropOffTemplates = templates.filter(t => t.service_type === 'drop_off')
    const pickUpTemplates = templates.filter(t => t.service_type === 'pick_up')

    expect(dropOffTemplates.length).toBeGreaterThan(0)
    expect(pickUpTemplates.length).toBeGreaterThan(0)

    // Test admin access to daily schedules
    const { data: dailySchedules, error: dailyError } = await supabase
      .from('daily_schedules')
      .select('*')
      .gte('schedule_date', new Date().toISOString().split('T')[0])
      .limit(10)

    expect(dailyError).toBeNull()
    expect(dailySchedules).toBeDefined()
    expect(dailySchedules.length).toBeGreaterThan(0)

    // Test admin access to terminal meeting points
    const { data: meetingPoints, error: meetingError } = await supabase
      .from('terminal_meeting_points')
      .select('*')

    expect(meetingError).toBeNull()
    expect(meetingPoints).toBeDefined()
    expect(meetingPoints.length).toBeGreaterThan(0)

    // Verify terminal codes are valid
    const validTerminals = ['1A', '1B', '1C', '2E', '2F', '3']
    for (const point of meetingPoints) {
      expect(validTerminals).toContain(point.terminal_code)
      expect(point.location_description).toBeDefined()
      expect(point.arrival_time_offset_min).toBeGreaterThan(0)
      expect(point.arrival_time_offset_max).toBeGreaterThan(point.arrival_time_offset_min)
    }
  })

  /**
   * Test 8.1.5: WhatsApp integration verification
   * Requirements: 10.4, 10.5
   */
  test('should verify WhatsApp integration components are accessible', async () => {
    // Test that booking status can be retrieved (needed for WhatsApp messages)
    if (testBookingCode) {
      const response = await fetch(`${supabaseUrl}/functions/v1/booking-status?code=${testBookingCode}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      })

      const result = await response.json()

      expect(response.ok).toBe(true)
      expect(result.ok).toBe(true)
      expect(result.found).toBe(true)
      expect(result.booking).toBeDefined()
      expect(result.booking.service_type).toBeDefined()
    }

    // Test that terminal meeting point data is available for WhatsApp messages
    const { data: meetingPoints, error } = await supabase
      .from('terminal_meeting_points')
      .select('*')
      .eq('terminal_code', '1A')
      .single()

    expect(error).toBeNull()
    expect(meetingPoints).toBeDefined()
    expect(meetingPoints.location_description).toBeDefined()
    expect(meetingPoints.arrival_time_offset_min).toBeDefined()
    expect(meetingPoints.arrival_time_offset_max).toBeDefined()
  })

  /**
   * Test 8.1.6: Advance booking validation
   * Requirements: 12.1, 12.2
   */
  test('should enforce advance booking validation', async () => {
    // Test same-day booking rejection
    const today = new Date().toISOString().split('T')[0]
    
    const sameDayBookingData = {
      customerName: 'Same Day Test User',
      phoneNumber: '081234567892',
      passengerCount: 1,
      flightNumber: 'GA789',
      serviceType: 'drop_off',
      scheduleId: testScheduleId,
      hasWhatsapp: 'yes',
      countryCode: '62',
      idempotencyKey: `test-sameday-${Date.now()}`,
      bookingDate: today
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/booking`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      },
      body: JSON.stringify(sameDayBookingData)
    })

    const result = await response.json()

    // Should reject same-day booking
    expect(result.ok).toBe(false)
    expect(result.error).toContain('advance')
  })
})