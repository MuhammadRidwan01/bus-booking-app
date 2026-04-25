// Feature: database-security
// Admin Booking Edge Function with admin JWT validation, rate limiting, and secure error handling

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCorsPreFlight, corsJsonResponse } from '../_shared/cors.ts'
import { validateAdminJWT } from '../_shared/auth.ts'
import { applyRateLimit, createRateLimitResponse } from '../_shared/rate-limit.ts'
import {
  handleError,
  parseRequestBody,
  validationError,
  unauthorizedError,
  forbiddenError,
  logRequest,
} from '../_shared/errors.ts'

// Zod for validation
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// Validation schema for admin booking request
const adminBookingRequestSchema = z.object({
  hotelId: z.string().uuid('Hotel ID tidak valid'),
  dailyScheduleId: z.string().uuid('Schedule ID tidak valid'),
  customerName: z.string().min(1, 'Nama lengkap harus diisi'),
  phoneNumber: z.string().min(5, 'Nomor telepon tidak valid'),
  passengerCount: z.number().int().positive().max(5, 'Jumlah penumpang maksimal 5 orang'),
  flightNumber: z.string().optional(),
  roomNumber: z.string().optional(),
  hasSurfboard: z.boolean().default(false),
  surfboardCount: z.number().int().min(0).default(0),
  excessBaggageCount: z.number().int().min(0).default(0),
})

type AdminBookingRequest = z.infer<typeof adminBookingRequestSchema>

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight()
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return corsJsonResponse({ ok: false, error: 'Method not allowed' }, 405)
  }

  try {
    // Log request (sanitized)
    logRequest(req, { endpoint: 'admin-booking' })

    // Apply rate limiting (20 requests per minute per IP)
    const rateLimitResult = applyRateLimit(req, 20, 60000, 'admin-booking')
    if (!rateLimitResult.allowed) {
      console.warn('[Rate Limit] Exceeded', {
        endpoint: 'admin-booking',
        retryAfter: rateLimitResult.retryAfter,
      })
      return createRateLimitResponse(rateLimitResult)
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Config Error] Missing Supabase configuration')
      return handleError(new Error('Server configuration error'), 'admin-booking-config')
    }

    // Validate admin JWT token
    const authHeader = req.headers.get('Authorization')
    const authResult = await validateAdminJWT(authHeader, supabaseUrl, supabaseServiceKey)

    if (!authResult.authenticated) {
      console.warn('[Admin Auth Failed]', { error: authResult.error })

      // Return 403 for non-admin users (authenticated but not authorized)
      if (authResult.error?.includes('not an administrator')) {
        return forbiddenError('Access denied')
      }

      // Return 401 for authentication failures
      return unauthorizedError('Authentication required')
    }

    // Parse and validate request body
    const body = await parseRequestBody<AdminBookingRequest>(req)
    if (!body) {
      return validationError('Invalid request body')
    }

    // Validate with Zod schema
    const validationResult = adminBookingRequestSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(', ')
      return validationError(errors)
    }

    const validatedData = validationResult.data

    // Create Supabase admin client (with service role key)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch schedule information and validate
    const { data: schedule, error: scheduleError } = await supabaseAdmin
      .from('daily_schedules')
      .select(`
        id,
        schedule_date,
        current_booked,
        status,
        bus_schedules (
          id,
          hotel_id,
          departure_time,
          destination,
          max_capacity
        )
      `)
      .eq('id', validatedData.dailyScheduleId)
      .single()

    if (scheduleError || !schedule) {
      console.error('[Schedule Error]', scheduleError)
      return validationError('Schedule not found')
    }

    // Validate schedule belongs to the specified hotel
    const busSchedule = Array.isArray(schedule.bus_schedules)
      ? schedule.bus_schedules[0]
      : schedule.bus_schedules

    if (!busSchedule || busSchedule.hotel_id !== validatedData.hotelId) {
      return validationError('Schedule does not match hotel')
    }

    // Check if schedule is active
    if (schedule.status === 'cancelled' || schedule.status === 'expired') {
      return validationError('Schedule is not active')
    }

    // Check capacity
    const maxCapacity = busSchedule.max_capacity ?? 0
    if (schedule.current_booked + validatedData.passengerCount > maxCapacity) {
      return validationError('Insufficient capacity')
    }

    // Generate unique booking code
    const bookingCode = generateBookingCode()

    // Normalize phone number to 62 format
    const normalizedPhone = normalizeTo62(validatedData.phoneNumber)

    // Prepare base URL for links
    const baseUrl = Deno.env.get('APP_BASE_URL')?.replace(/\/$/, '') || ''
    const trackLink = `${baseUrl}/track?code=${bookingCode}`
    const pdfLink = `${baseUrl}/api/ticket/${bookingCode}`

    // Get pricing configuration for cost calculation
    const { data: pricingConfig } = await supabaseAdmin
      .from('pricing_config')
      .select('*')
      .eq('is_active', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single()

    // Calculate costs for additional services
    let surfboardCost = 0
    let baggageCost = 0
    let totalCost = 0

    if (pricingConfig) {
      // Calculate surfboard cost
      if (validatedData.hasSurfboard && validatedData.surfboardCount > 0) {
        surfboardCost = validatedData.surfboardCount * pricingConfig.surfboard_cost_per_board
      }

      // Calculate baggage cost (simplified - using other terminals cost for admin bookings)
      if (validatedData.excessBaggageCount > 0) {
        baggageCost = pricingConfig.baggage_other_terminals_cost
      }

      totalCost = surfboardCost + baggageCost
    }

    // Insert booking into database
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        booking_code: bookingCode,
        hotel_id: validatedData.hotelId,
        daily_schedule_id: validatedData.dailyScheduleId,
        customer_name: validatedData.customerName,
        phone: normalizedPhone,
        passenger_count: validatedData.passengerCount,
        status: 'confirmed',
        room_number: validatedData.roomNumber,
        flight_number: validatedData.flightNumber,
        has_surfboard: validatedData.hasSurfboard,
        surfboard_count: validatedData.surfboardCount,
        excess_baggage_count: validatedData.excessBaggageCount,
        surfboard_cost: surfboardCost,
        baggage_cost: baggageCost,
        total_cost: totalCost,
      })
      .select()
      .single()

    if (bookingError) {
      console.error('[Booking Insert Error]', bookingError)
      return handleError(bookingError, 'admin-booking-insert')
    }

    // Update capacity using RPC
    const { error: capacityError } = await supabaseAdmin.rpc('increment_capacity', {
      schedule_id: validatedData.dailyScheduleId,
      increment: validatedData.passengerCount,
    })

    if (capacityError) {
      console.error('[Capacity Update Error]', capacityError)
      // Don't fail the booking, just log the error
    }

    // Return success response immediately
    return corsJsonResponse({
      ok: true,
      data: {
        booking: {
          id: booking.id,
          booking_code: bookingCode,
          customer_name: validatedData.customerName,
          phone: normalizedPhone,
          passenger_count: validatedData.passengerCount,
          room_number: validatedData.roomNumber,
          flight_number: validatedData.flightNumber,
          has_surfboard: validatedData.hasSurfboard,
          surfboard_count: validatedData.surfboardCount,
          excess_baggage_count: validatedData.excessBaggageCount,
          surfboard_cost: surfboardCost,
          baggage_cost: baggageCost,
          total_cost: totalCost,
          status: 'confirmed',
          hotel_id: validatedData.hotelId,
          daily_schedule_id: validatedData.dailyScheduleId,
        },
      },
    })
  } catch (error) {
    // Handle all errors securely (no internal details exposed)
    return handleError(error, 'admin-booking-main')
  }
})

// Helper functions

/**
 * Generate unique booking code
 */
function generateBookingCode(): string {
  const prefix = 'IBX'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substr(2, 3).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

/**
 * Normalize phone number to 62 format (Indonesian)
 */
function normalizeTo62(phone: string): string {
  // Remove all non-digit characters except +
  let digits = phone.replace(/[^\d+]/g, '')

  // If starts with +, remove it
  if (digits.startsWith('+')) {
    digits = digits.slice(1)
  }

  // If already starts with 62, return as is
  if (digits.startsWith('62')) {
    return digits
  }

  // If starts with 0, replace with 62
  if (digits.startsWith('0')) {
    return '62' + digits.slice(1)
  }

  // Otherwise, prepend 62
  return '62' + digits
}

/**
 * Format date for display
 */
function formatDate(date: string): string {
  const d = new Date(date)
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Format time for display
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  return `${hours}:${minutes}`
}



/**
 * Get hotel details from database
 */
async function getHotelDetails(supabaseAdmin: any, hotelId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('hotels')
      .select('*')
      .eq('id', hotelId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[Hotel Details Error]', error)
    return null
  }
}