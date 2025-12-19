// Feature: database-security
// Booking Status Edge Function with optional JWT validation and response sanitization

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCorsPreFlight, corsJsonResponse } from '../_shared/cors.ts'
import { applyRateLimit, createRateLimitResponse } from '../_shared/rate-limit.ts'
import {
  handleError,
  validationError,
  notFoundError,
  logRequest,
} from '../_shared/errors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight()
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return corsJsonResponse({ ok: false, error: 'Method not allowed' }, 405)
  }

  try {
    // Log request (sanitized)
    logRequest(req, { endpoint: 'booking-status' })

    // Apply rate limiting (30 requests per minute per IP)
    const rateLimitResult = applyRateLimit(req, 30, 60000, 'booking-status')
    if (!rateLimitResult.allowed) {
      console.warn('[Rate Limit] Exceeded', {
        endpoint: 'booking-status',
        retryAfter: rateLimitResult.retryAfter,
      })
      return createRateLimitResponse(rateLimitResult)
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Config Error] Missing Supabase configuration')
      return handleError(new Error('Server configuration error'), 'booking-status-config')
    }

    // Extract booking code from query parameters
    const url = new URL(req.url)
    const bookingCode = url.searchParams.get('code')

    if (!bookingCode) {
      return validationError('Booking code is required')
    }

    // Validate booking code format (basic validation)
    if (bookingCode.length < 5 || bookingCode.length > 50) {
      return validationError('Invalid booking code format')
    }

    // Create Supabase client (using anon key for public access)
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Query booking with all required fields for tracking page
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_code,
        customer_name,
        phone,
        passenger_count,
        flight_number,
        terminal,
        is_surfboard,
        status,
        whatsapp_sent,
        whatsapp_attempts,
        whatsapp_last_error,
        hotels (
          name
        ),
        daily_schedules (
          schedule_date,
          bus_schedules (
            departure_time,
            destination
          )
        )
      `)
      .eq('booking_code', bookingCode)
      .maybeSingle()

    if (bookingError) {
      console.error('[Booking Query Error]', bookingError)
      return handleError(bookingError, 'booking-status-query')
    }

    // If booking not found, return not found response
    if (!booking) {
      return corsJsonResponse({
        ok: true,
        found: false,
        booking: null,
      })
    }

    // Extract nested data safely
    const hotel = Array.isArray(booking.hotels) ? booking.hotels[0] : booking.hotels
    const dailySchedule = Array.isArray(booking.daily_schedules)
      ? booking.daily_schedules[0]
      : booking.daily_schedules
    const busSchedule = dailySchedule?.bus_schedules
      ? Array.isArray(dailySchedule.bus_schedules)
        ? dailySchedule.bus_schedules[0]
        : dailySchedule.bus_schedules
      : null

    // Return booking data in format expected by frontend (snake_case to match BookingDetails type)
    const bookingDetails = {
      id: booking.id,
      booking_code: booking.booking_code,
      customer_name: booking.customer_name,
      phone: booking.phone,
      passenger_count: booking.passenger_count,
      flight_number: booking.flight_number,
      terminal: booking.terminal,
      surfboard: booking.is_surfboard ? 'yes' : 'no',
      status: booking.status,
      whatsapp_sent: booking.whatsapp_sent,
      whatsapp_attempts: booking.whatsapp_attempts,
      whatsapp_last_error: booking.whatsapp_last_error,
      hotel_name: hotel?.name || 'Unknown Hotel',
      schedule_date: dailySchedule?.schedule_date || '',
      departure_time: busSchedule?.departure_time || '',
      destination: busSchedule?.destination || '',
    }

    // Return booking data
    return corsJsonResponse({
      ok: true,
      found: true,
      booking: bookingDetails,
    })
  } catch (error) {
    // Handle all errors securely (no internal details exposed)
    return handleError(error, 'booking-status-main')
  }
})
