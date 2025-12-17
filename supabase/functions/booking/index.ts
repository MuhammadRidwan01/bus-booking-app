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

// Validation schema matching the original booking schema
const bookingRequestSchema = z.object({
  customerName: z.string().min(1, 'Nama lengkap harus diisi'),
  phoneNumber: z.string().min(5, 'Nomor WhatsApp tidak valid'),
  countryCode: z.string().min(1, 'Kode negara harus diisi'),
  bookingDate: z.string().min(1, 'Tanggal booking harus dipilih'),
  scheduleId: z.string().uuid('Schedule ID tidak valid'),
  passengerCount: z.number().min(1).max(5, 'Jumlah penumpang maksimal 5 orang'),
  flightNumber: z.string().min(1, 'Nomor penerbangan harus diisi'),
  idempotencyKey: z.string().min(8, 'Idempotency key tidak valid'),
  hasWhatsapp: z.enum(['yes', 'no']).default('yes'),
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

    const busSchedule = Array.isArray(schedule.bus_schedules)
      ? schedule.bus_schedules[0]
      : schedule.bus_schedules
    const maxCapacity = busSchedule?.max_capacity

    // Check capacity
    if (!maxCapacity || schedule.current_booked + validatedData.passengerCount > maxCapacity) {
      return validationError('Kapasitas tidak mencukupi')
    }


    // Generate unique booking code
    const bookingCode = generateBookingCode()

    // Normalize phone number
    const normalizedPhone = normalizePhoneWithCountry(
      validatedData.phoneNumber,
      validatedData.countryCode
    )

    // Prepare booking data
    const insertPayload: Record<string, any> = {
      booking_code: bookingCode,
      hotel_id: busSchedule?.hotel_id,
      daily_schedule_id: validatedData.scheduleId,
      customer_name: validatedData.customerName,
      phone: normalizedPhone,
      passenger_count: validatedData.passengerCount,
      status: 'confirmed',
      flight_number: validatedData.flightNumber,
      has_whatsapp: validatedData.hasWhatsapp === 'yes',
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
    const hotel = busSchedule?.hotel_id ? await getHotelDetails(supabaseAdmin, busSchedule.hotel_id) : null

    // Prepare WhatsApp message
    const baseUrl = Deno.env.get('APP_BASE_URL')?.replace(/\/$/, '') || ''
    const trackLink = `${baseUrl}/track?code=${bookingCode}`
    const pdfLink = `${baseUrl}/api/ticket/${bookingCode}`

    const messageParts = [
      `Halo ${validatedData.customerName}, booking shuttle kamu sudah berhasil.`,
      `Hotel: ${hotel?.name ?? 'Ibis Hotel'}`,
      `Tanggal: ${formatDate(validatedData.bookingDate)}`,
      busSchedule?.departure_time ? `Jam: ${formatTime(busSchedule.departure_time)} WIB` : null,
      busSchedule?.destination ? `Tujuan: ${busSchedule.destination}` : null,
      `Kode Booking: ${bookingCode}`,
      `Lacak tiket: ${trackLink}`,
      'Terima kasih.',
    ].filter(Boolean)
    const whatsappMessage = messageParts.join('\n')

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
          flight_number: validatedData.flightNumber,
          status: 'confirmed',
        },
      },
    })
  } catch (error) {
    // Handle all errors securely (no internal details exposed)
    return handleError(error, 'booking-main')
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
