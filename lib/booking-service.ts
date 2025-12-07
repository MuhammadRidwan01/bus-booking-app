import { supabase } from "./supabase-browser"

/**
 * Booking service client for Edge Function calls
 * This is a thin wrapper that handles authentication and HTTP communication
 */

export interface BookingFormData {
  customerName: string
  phoneNumber: string
  countryCode: string
  bookingDate: string
  scheduleId: string
  passengerCount: number
  roomNumber: string
  idempotencyKey: string
  hasWhatsapp: "yes" | "no"
}

export interface BookingConfirmation {
  bookingCode: string
  booking: any
}

export interface BookingStatusResponse {
  whatsapp_sent: boolean
  whatsapp_attempts: number
  whatsapp_last_error: string | null
}

/**
 * Create a new booking via Edge Function
 */
export async function createBooking(data: BookingFormData): Promise<{
  ok: boolean
  data?: BookingConfirmation
  error?: string
}> {
  try {
    // Get user session for JWT token
    const { data: { session } } = await supabase.auth.getSession()
    
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/booking`
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      return {
        ok: false,
        error: result.error || 'Failed to create booking'
      }
    }
    
    return {
      ok: true,
      data: result.data
    }
  } catch (error) {
    console.error('Booking service error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

/**
 * Get booking status by code via Edge Function
 */
export async function getBookingStatus(code: string): Promise<{
  ok: boolean
  found?: boolean
  booking?: any
  error?: string
}> {
  try {
    // Get user session for JWT token (optional for public access)
    const { data: { session } } = await supabase.auth.getSession()
    
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/booking-status?code=${encodeURIComponent(code)}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    // Include JWT if available (but not required for public access)
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'GET',
      headers
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      return {
        ok: false,
        error: result.error || 'Failed to get booking status'
      }
    }
    
    return {
      ok: true,
      found: result.found,
      booking: result.booking
    }
  } catch (error) {
    console.error('Booking status service error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

/**
 * Create admin booking via Edge Function
 */
export async function createAdminBooking(data: {
  hotelId: string
  dailyScheduleId: string
  customerName: string
  phoneNumber: string
  passengerCount: number
  roomNumber: string
}): Promise<{
  ok: boolean
  data?: any
  whatsappSent?: boolean
  error?: string
}> {
  try {
    // Get admin session for JWT token
    const { data: { session } } = await supabase.auth.getSession()
    
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-booking`
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      return {
        ok: false,
        error: result.error || 'Failed to create admin booking'
      }
    }
    
    return {
      ok: true,
      data: result.data,
      whatsappSent: result.whatsappSent
    }
  } catch (error) {
    console.error('Admin booking service error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}
