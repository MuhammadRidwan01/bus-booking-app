// Feature: database-security
// Booking Edge Function with JWT validation, rate limiting, and secure error handling

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCorsPreFlight, corsJsonResponse } from '../_shared/cors.ts'
import { validateJWT } from '../_shared/auth.ts'
import { applyRateLimit, createRateLimitResponse } from '../_shared/rate-limit.ts'
import {
  handleError,
  parseRequestBody,
  validationError,
  unauthorizedError,
  logRequest,
} from '../_shared/errors.ts'

// Zod for validation
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// Validation schema matching the updated booking schema
const bookingRequestSchema = z.object({
  customerName: z.string().min(1, 'Nama lengkap harus diisi'),
  phoneNumber: z.string().min(5, 'Nomor WhatsApp tidak valid'),
  countryCode: z.string().min(1, 'Kode negara harus diisi'),
  bookingDate: z.string().min(1, 'Tanggal booking harus dipilih'),
  scheduleId: z.string().uuid('Schedule ID tidak valid'),
  passengerCount: z.number().min(1).max(5, 'Jumlah penumpang maksimal 5 orang'),
  idempotencyKey: z.string().min(8, 'Idempotency key tidak valid'),
  hasWhatsapp: z.enum(['yes', 'no']).default('yes'),
  serviceType: z.enum(['drop_off', 'pick_up'], {
    required_error: 'Jenis layanan harus dipilih',
    invalid_type_error: 'Jenis layanan tidak valid'
  }),
  terminalCode: z.string().nullable().optional(),
  meetingPointId: z.string().nullable().optional().refine((val) => {
    if (!val || val === "") return true
    return z.string().uuid().safeParse(val).success
  }, {
    message: "Meeting point ID tidak valid"
  }),
  // Enhanced booking fields
  roomNumber: z.string().optional(),
  flightNumber: z.string().optional(),
  hasSurfboard: z.boolean().default(false),
  surfboardCount: z.number().min(0).max(10).default(0),
  hasExcessBaggage: z.boolean().default(false),
  excessBaggageCount: z.number().min(0).max(20).default(0), // Keep for backward compatibility
  surfboardCost: z.number().min(0).default(0),
  baggageCost: z.number().min(0).default(0),
  totalCost: z.number().min(0).default(0),
})

type BookingRequest = z.infer<typeof bookingRequestSchema>

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
    logRequest(req, { endpoint: 'booking' })

    // Apply rate limiting (10 requests per minute per IP)
    const rateLimitResult = applyRateLimit(req, 10, 60000, 'booking')
    if (!rateLimitResult.allowed) {
      console.warn('[Rate Limit] Exceeded', {
        endpoint: 'booking',
        retryAfter: rateLimitResult.retryAfter,
      })
      return createRateLimitResponse(rateLimitResult)
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('[Config Error] Missing Supabase configuration')
      return handleError(new Error('Server configuration error'), 'booking-config')
    }

    // Validate JWT token (optional for public booking)
    // Allow anonymous requests with anon key for public bookings
    const authHeader = req.headers.get('Authorization')
    let isAuthenticated = false

    if (authHeader) {
      const authResult = await validateJWT(authHeader, supabaseUrl, supabaseAnonKey)
      isAuthenticated = authResult.authenticated

      // Log authentication status but don't block
      if (!isAuthenticated) {
        console.info('[Auth] Anonymous booking request')
      }
    }

    // Parse and validate request body
    const body = await parseRequestBody<BookingRequest>(req)
    if (!body) {
      return validationError('Invalid request body')
    }

    // Validate with Zod schema
    const validationResult = bookingRequestSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => e.message).join(', ')
      return validationError(errors)
    }

    const validatedData = validationResult.data

    // Additional validation for service-specific fields
    if (validatedData.serviceType === 'drop_off') {
      if (!validatedData.roomNumber || validatedData.roomNumber.trim() === '') {
        return validationError('Nomor kamar harus diisi untuk layanan drop-off')
      }
      if (validatedData.flightNumber && validatedData.flightNumber.trim() !== '') {
        return validationError('Nomor penerbangan tidak diperlukan untuk layanan drop-off')
      }
    } else if (validatedData.serviceType === 'pick_up') {
      if (!validatedData.flightNumber || validatedData.flightNumber.trim() === '') {
        return validationError('Nomor penerbangan harus diisi untuk layanan pick-up')
      }
      if (validatedData.roomNumber && validatedData.roomNumber.trim() !== '') {
        return validationError('Nomor kamar tidak diperlukan untuk layanan pick-up')
      }
    }

    // Additional validation for pick-up bookings (terminal selection)
    if (validatedData.serviceType === 'pick_up') {
      if (!validatedData.terminalCode) {
        return validationError('Terminal harus dipilih untuk layanan pick-up')
      }
      if (!validatedData.meetingPointId) {
        return validationError('Meeting point harus dipilih untuk layanan pick-up')
      }
    }

    // Surfboard validation
    if (validatedData.hasSurfboard && validatedData.surfboardCount <= 0) {
      return validationError('Jumlah surfboard harus lebih dari 0 jika membawa surfboard')
    }
    if (!validatedData.hasSurfboard && validatedData.surfboardCount > 0) {
      return validationError('Jumlah surfboard harus 0 jika tidak membawa surfboard')
    }

    // Pricing validation
    const expectedTotal = validatedData.surfboardCost + validatedData.baggageCost
    if (Math.abs(validatedData.totalCost - expectedTotal) > 0.01) {
      return validationError('Total biaya tidak sesuai dengan perhitungan (surfboard + bagasi)')
    }

    // Create Supabase admin client (with service role key)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Check for existing booking with idempotency key
    let idempotencySupported = true
    let existingBooking = null as { id: string; booking_code: string } | null

    try {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('bookings')
        .select('id, booking_code')
        .eq('idempotency_key', validatedData.idempotencyKey)
        .maybeSingle()

      if (existingError) {
        // Column might not exist if migration hasn't run
        if (existingError.code === '42703') {
          idempotencySupported = false
        } else if (existingError.code !== 'PGRST116') {
          throw existingError
        }
      } else {
        existingBooking = existing
      }
    } catch (error) {
      console.error('[Idempotency Check Error]', error)
      // Continue without idempotency if check fails
      idempotencySupported = false
    }

    // If booking already exists, return existing booking code
    if (existingBooking) {
      return corsJsonResponse({
        ok: true,
        data: {
          bookingCode: existingBooking.booking_code,
          message: 'Booking already exists',
        },
      })
    }

    // Fetch schedule information and capacity
    const { data: schedule, error: scheduleError } = await supabaseAdmin
      .from('daily_schedules')
      .select(`
        id,
        schedule_date,
        current_booked,
        status,
        service_type,
        departure_time,
        capacity,
        hotel,
        bus_schedule_id,
        bus_schedules (
          hotel_id,
          max_capacity,
          departure_time,
          destination
        )
      `)
      .eq('id', validatedData.scheduleId)
      .single()

    if (scheduleError || !schedule) {
      console.error('[Schedule Error]', scheduleError)
      return validationError('Jadwal tidak ditemukan')
    }

    // Check if schedule is cancelled
    if (schedule.status === 'cancelled') {
      return validationError('Jadwal ini sudah dibatalkan')
    }

    // Validate service type matches schedule
    if (schedule.service_type && schedule.service_type !== validatedData.serviceType) {
      return validationError('Jenis layanan tidak sesuai dengan jadwal yang dipilih')
    }

    // Use capacity from daily_schedules if available, otherwise fall back to bus_schedules
    const maxCapacity = schedule.capacity || (Array.isArray(schedule.bus_schedules)
      ? schedule.bus_schedules[0]?.max_capacity
      : schedule.bus_schedules?.max_capacity)

    // Check capacity - ensure we have a valid capacity value
    if (!maxCapacity) {
      console.error('[Capacity Error] No capacity found for schedule:', {
        scheduleId: validatedData.scheduleId,
        dailyScheduleCapacity: schedule.capacity,
        busScheduleCapacity: schedule.bus_schedules
      })
      return validationError('Kapasitas jadwal tidak valid')
    }

    if (schedule.current_booked + validatedData.passengerCount > maxCapacity) {
      return validationError('Kapasitas tidak mencukupi')
    }

    // Validate advance booking requirement (minimum 20 minutes prior)
    const departureTime = schedule.departure_time || (Array.isArray(schedule.bus_schedules)
      ? schedule.bus_schedules[0]?.departure_time
      : schedule.bus_schedules?.departure_time)

    if (departureTime) {
      const departureDateTime = new Date(`${schedule.schedule_date}T${departureTime}`)
      if (!validateAdvanceBooking(departureDateTime)) {
        return validationError('Booking harus dilakukan minimal 20 menit sebelum keberangkatan')
      }
    }


    // Generate unique booking code
    const bookingCode = generateBookingCode()

    // Normalize phone number
    const normalizedPhone = normalizePhoneWithCountry(
      validatedData.phoneNumber,
      validatedData.countryCode
    )

    // Get hotel_id from schedule data
    let hotelId = null

    // First try to get hotel_id from bus_schedules if available
    const busSchedule = Array.isArray(schedule.bus_schedules)
      ? schedule.bus_schedules[0]
      : schedule.bus_schedules

    if (busSchedule?.hotel_id) {
      hotelId = busSchedule.hotel_id
    } else if (schedule.hotel) {
      // Fallback: get hotel_id from hotels table using hotel slug
      const { data: hotelData } = await supabaseAdmin
        .from('hotels')
        .select('id')
        .eq('slug', schedule.hotel)
        .single()
      hotelId = hotelData?.id
    }

    // Ensure we have a valid hotel_id
    if (!hotelId) {
      console.error('[Hotel Error] No hotel_id found for schedule:', {
        scheduleId: validatedData.scheduleId,
        scheduleHotel: schedule.hotel,
        busScheduleHotelId: busSchedule?.hotel_id
      })
      return validationError('Hotel tidak ditemukan')
    }

    // Prepare booking data
    const insertPayload: Record<string, any> = {
      booking_code: bookingCode,
      hotel_id: hotelId,
      daily_schedule_id: validatedData.scheduleId,
      customer_name: validatedData.customerName,
      phone: normalizedPhone,
      passenger_count: validatedData.passengerCount,
      status: 'confirmed',
      service_type: validatedData.serviceType,
      // Enhanced booking fields
      room_number: validatedData.roomNumber || null,
      flight_number: validatedData.flightNumber || null,
      has_surfboard: validatedData.hasSurfboard,
      surfboard_count: validatedData.surfboardCount,
      excess_baggage_count: validatedData.excessBaggageCount,
      surfboard_cost: validatedData.surfboardCost,
      baggage_cost: validatedData.baggageCost,
      total_cost: validatedData.totalCost,
    }

    // Add terminal and meeting point info for pick-up bookings
    if (validatedData.serviceType === 'pick_up') {
      if (validatedData.terminalCode) {
        insertPayload.terminal_code = validatedData.terminalCode
      }
      if (validatedData.meetingPointId) {
        insertPayload.meeting_point_id = validatedData.meetingPointId
      }
    }

    if (idempotencySupported) {
      insertPayload.idempotency_key = validatedData.idempotencyKey
    }

    // Insert booking into database
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(insertPayload)
      .select()
      .single()

    if (bookingError) {
      // Handle duplicate idempotency key
      if (bookingError.code === '23505' && idempotencySupported) {
        const { data: dupBooking } = await supabaseAdmin
          .from('bookings')
          .select('id, booking_code')
          .eq('idempotency_key', validatedData.idempotencyKey)
          .maybeSingle()

        if (dupBooking) {
          return corsJsonResponse({
            ok: true,
            data: {
              bookingCode: dupBooking.booking_code,
              message: 'Booking already exists',
            },
          })
        }
      }

      console.error('[Booking Insert Error]', bookingError)
      return handleError(bookingError, 'booking-insert')
    }

    // Update capacity using RPC
    const { error: capacityError } = await supabaseAdmin.rpc('increment_capacity', {
      schedule_id: validatedData.scheduleId,
      increment: validatedData.passengerCount,
    })

    if (capacityError) {
      console.error('[Capacity Update Error]', capacityError)
      // Don't fail the booking, just log the error
    }

    // Get hotel details for WhatsApp message
    const hotel = hotelId ? await getHotelDetails(supabaseAdmin, hotelId) : null

    // Get terminal meeting point details for pick-up bookings
    let meetingPointInfo = null
    if (validatedData.serviceType === 'pick_up' && validatedData.meetingPointId) {
      const { data: meetingPoint } = await supabaseAdmin
        .from('terminal_meeting_points')
        .select('*')
        .eq('id', validatedData.meetingPointId)
        .single()
      meetingPointInfo = meetingPoint
    }

    // Prepare WhatsApp message
    const baseUrl = Deno.env.get('APP_BASE_URL')?.replace(/\/$/, '') || ''
    const trackLink = `${baseUrl}/track?code=${bookingCode}`
    const pdfLink = `${baseUrl}/api/ticket/${bookingCode}`

    const serviceTypeText = validatedData.serviceType === 'drop_off'
      ? 'Hotel ke Bandara'
      : 'Bandara ke Hotel'

    const messageParts = [
      `Halo ${validatedData.customerName}, booking shuttle kamu sudah berhasil.`,
      `Hotel: ${hotel?.name ?? 'Ibis Hotel'}`,
      `Layanan: ${serviceTypeText}`,
      `Tanggal: ${formatDate(validatedData.bookingDate)}`,
      departureTime ? `Jam: ${formatTime(departureTime)} WIB` : null,
      busSchedule?.destination ? `Tujuan: ${busSchedule.destination}` : null,
    ]

    // Add service-specific information
    if (validatedData.serviceType === 'drop_off' && validatedData.roomNumber) {
      messageParts.push(`Kamar: ${validatedData.roomNumber}`)
    }
    if (validatedData.serviceType === 'pick_up' && validatedData.flightNumber) {
      messageParts.push(`Penerbangan: ${validatedData.flightNumber}`)
    }

    // Add terminal and meeting point info for pick-up bookings
    if (validatedData.serviceType === 'pick_up' && meetingPointInfo) {
      messageParts.push(`Terminal: ${validatedData.terminalCode}`)
      messageParts.push(`Titik Jemput: ${meetingPointInfo.location_description}`)
      messageParts.push(`Estimasi Tiba: ${meetingPointInfo.arrival_time_offset_min}-${meetingPointInfo.arrival_time_offset_max} menit setelah keberangkatan`)
    }

    // Add additional services information
    if (validatedData.hasSurfboard && validatedData.surfboardCount > 0) {
      messageParts.push(`Surfboard: ${validatedData.surfboardCount} papan`)
    }
    if (validatedData.excessBaggageCount > 0) {
      messageParts.push(`Bagasi Tambahan: ${validatedData.excessBaggageCount} item`)
    }
    if (validatedData.totalCost > 0) {
      messageParts.push(`Total Biaya: Rp ${validatedData.totalCost.toLocaleString('id-ID')}`)
    }

    // Generate driver notifications for additional services
    const driverNotifications: string[] = []
    if (validatedData.hasSurfboard && validatedData.surfboardCount > 0) {
      driverNotifications.push(`⚠️ SURFBOARD: ${validatedData.surfboardCount} papan surfboard memerlukan penanganan khusus`)
    }
    if (validatedData.excessBaggageCount > 0) {
      driverNotifications.push(`⚠️ BAGASI BERLEBIH: ${validatedData.excessBaggageCount} item bagasi tambahan`)
    }

    // Store driver notifications in booking record
    if (driverNotifications.length > 0) {
      await supabaseAdmin
        .from('bookings')
        .update({
          driver_notes: driverNotifications.join(' | ')
        })
        .eq('id', booking.id)
    }

    // Create structured driver notifications for tracking and acknowledgment
    try {
      await supabaseAdmin
        .rpc('create_driver_notifications_for_booking', {
          p_booking_id: booking.id
        })
    } catch (notificationError) {
      console.error('Failed to create driver notifications:', notificationError)
      // Don't fail the booking if notification creation fails
    }

    messageParts.push(
      `Kode Booking: ${bookingCode}`,
      `Lacak tiket: ${trackLink}`,
      'Terima kasih.'
    )

    const whatsappMessage = messageParts.filter(Boolean).join('\n')

    // Send WhatsApp in background (don't block response)
    const attemptCount = (booking as any)?.whatsapp_attempts ? Number((booking as any).whatsapp_attempts) : 0
    const userHasWhatsapp = validatedData.hasWhatsapp !== 'no'

    if (!userHasWhatsapp) {
      // User indicated no WhatsApp, log it
      await supabaseAdmin
        .from('bookings')
        .update({
          whatsapp_attempts: attemptCount,
          whatsapp_sent: false,
          whatsapp_last_error: 'User indicated number is not on WhatsApp',
        })
        .eq('id', booking.id)
    } else {
      // Send WhatsApp in background (async, don't await)
      sendWhatsAppInBackground(
        supabaseAdmin,
        booking.id,
        normalizedPhone,
        whatsappMessage,
        pdfLink,
        bookingCode,
        attemptCount
      )
    }

    // Return success response immediately
    return corsJsonResponse({
      ok: true,
      data: {
        bookingCode,
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
          surfboard_cost: validatedData.surfboardCost,
          baggage_cost: validatedData.baggageCost,
          total_cost: validatedData.totalCost,
          status: 'confirmed',
        },
      },
    })
  } catch (error) {
    // Log detailed error information
    console.error('[Booking Error]', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      validatedData: validatedData ? {
        scheduleId: validatedData.scheduleId,
        serviceType: validatedData.serviceType,
        passengerCount: validatedData.passengerCount
      } : 'validation failed'
    })

    // Handle all errors securely (no internal details exposed)
    return handleError(error, 'booking-main')
  }
})

// Helper functions

/**
 * Validate advance booking requirement (minimum 20 minutes prior)
 */
function validateAdvanceBooking(departureDateTime: Date): boolean {
  const now = new Date()
  const jakartaNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
  const twentyMinutesFromNow = new Date(jakartaNow.getTime() + 20 * 60 * 1000)

  return departureDateTime >= twentyMinutesFromNow
}

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
 * Normalize phone number with country code
 */
function normalizePhoneWithCountry(phone: string, countryCode: string): string {
  const digits = phone.replace(/[^\d+]/g, '')

  if (digits.startsWith('+')) {
    return digits.slice(1)
  }

  const code = (countryCode || '').replace(/\D/g, '') || '62'
  const local = digits.replace(/\D/g, '')

  if (local.startsWith(code)) return local
  if (local.startsWith('0')) return code + local.slice(1)
  return code + local
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

/**
 * Format date for display
 */
function formatDate(date: string): string {
  const d = new Date(date)
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
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
 * Send WhatsApp message in background
 */
async function sendWhatsAppInBackground(
  supabaseAdmin: any,
  bookingId: string,
  phone: string,
  message: string,
  pdfUrl: string,
  bookingCode: string,
  attemptCount: number
) {
  try {
    const waResult = await sendWhatsappMessage({
      phone,
      message,
      pdfUrl,
      caption: `Tiket Shuttle - ${bookingCode}`,
    })

    const waErrorMessage = waResult.ok
      ? null
      : (waResult.data as any)?.error ?? (waResult.data as any)?.detail ?? 'Fonnte send failed'

    if (!waResult.ok && waResult.data && (waResult.data as any).pdfUrl) {
      console.error('[WhatsApp] PDF not sent, link fallback', (waResult.data as any).pdfUrl)
    }

    // Update booking with WhatsApp status
    await supabaseAdmin
      .from('bookings')
      .update({
        whatsapp_attempts: attemptCount + 1,
        whatsapp_sent: waResult.ok,
        whatsapp_last_error: waResult.ok ? null : waErrorMessage,
      })
      .eq('id', bookingId)
  } catch (waError) {
    console.error('[WhatsApp Error]', waError instanceof Error ? waError.message : waError)

    // Log error to database
    await supabaseAdmin
      .from('bookings')
      .update({
        whatsapp_attempts: attemptCount + 1,
        whatsapp_sent: false,
        whatsapp_last_error: waError instanceof Error ? waError.message : 'Network/timeout to Fonnte',
      })
      .eq('id', bookingId)
  }
}

/**
 * Send WhatsApp message via Fonnte API
 */
async function sendWhatsappMessage(params: {
  phone: string
  message: string
  pdfUrl?: string
  caption?: string
}): Promise<{ ok: boolean; data: unknown }> {
  const fonnteToken = Deno.env.get('FONNTE_TOKEN')

  if (!fonnteToken) {
    console.error('[WhatsApp Config] Missing FONNTE_TOKEN')
    return { ok: false, data: { error: 'WhatsApp configuration missing' } }
  }

  let lastError: unknown = null

  // Fonnte accepts FormData
  const formData = new FormData()
  formData.append('target', params.phone)
  formData.append('message', params.message)
  formData.append('countryCode', '62') // Default to Indonesia

  if (params.pdfUrl) {
    // Attempt to fetch the PDF server-side to handle localhost/internal URLs
    try {
      console.log('[WhatsApp] Fetching PDF from:', params.pdfUrl)
      const pdfRes = await fetch(params.pdfUrl)
      if (pdfRes.ok) {
        const pdfBuffer = await pdfRes.arrayBuffer()
        // Append file with filename 'tiket-shuttle.pdf'
        // Blob is supported in Deno
        formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 'tiket-shuttle.pdf')
      } else {
        console.warn('[WhatsApp] Failed to fetch PDF, falling back to URL:', pdfRes.status)
        formData.append('url', params.pdfUrl)
        formData.append('filename', 'tiket-shuttle.pdf')
      }
    } catch (err) {
      console.error('[WhatsApp] Error fetching PDF:', err)
      // Fallback to URL if fetch fails completely
      formData.append('url', params.pdfUrl)
      formData.append('filename', 'tiket-shuttle.pdf')
    }
  }

  // Retry up to 2 times
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': fonnteToken,
        },
        body: formData,
      })

      const data = await response.json().catch(() => ({ ok: false, error: 'Invalid JSON response' }))

      // Fonnte success response usually has "status": true
      if (response.ok && (data as any)?.status) {
        return { ok: true, data }
      }

      // If response is not ok, or status is false
      const shouldRetry = response.status >= 500 || response.status === 408
      if (!shouldRetry || attempt === 2) {
        lastError = data
        break
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000))
      continue
    } catch (error) {
      lastError = error
      if (attempt === 2) {
        break
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.error('[WhatsApp Send Failed]', {
    phone: params.phone,
    error: lastError instanceof Error ? lastError.message : lastError,
  })

  return { ok: false, data: lastError }
}
