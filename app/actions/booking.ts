"use server"

import { getSupabaseAdmin } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { bookingSchema, pickupBookingSchema, validateAdvanceBooking } from "@/lib/validations"

export async function createBooking(formData: FormData) {
  if (!formData) {
    throw new Error("formData is null")
  }

  const customerName = formData.get("customerName")
  if (!customerName) {
    throw new Error("Nama lengkap harus diisi")
  }

  try {
    // Extract data from form
    const rawData = {
      customerName: formData.get("customerName") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      bookingDate: formData.get("bookingDate") as string,
      scheduleId: formData.get("scheduleId") as string,
      passengerCount: Number.parseInt(formData.get("passengerCount") as string),
      idempotencyKey: formData.get("idempotencyKey") as string,
      countryCode: (formData.get("countryCode") as string) || "62",
      serviceType: formData.get("serviceType") as "drop_off" | "pick_up",
      terminalCode: formData.get("terminalCode") as string | undefined,
      meetingPointId: formData.get("meetingPointId") as string | undefined,
      // Enhanced booking fields
      roomNumber: formData.get("roomNumber") as string | undefined,
      flightNumber: formData.get("flightNumber") as string | undefined,
      hasSurfboard: (formData.get("hasSurfboard") as string) === "true",
      surfboardCount: Number.parseInt(formData.get("surfboardCount") as string) || 0,
      hasExcessBaggage: (formData.get("hasExcessBaggage") as string) === "true",
      excessBaggageCount: Number.parseInt(formData.get("excessBaggageCount") as string) || 0, // Keep for backward compatibility
      surfboardCost: Number.parseFloat(formData.get("surfboardCost") as string) || 0,
      baggageCost: Number.parseFloat(formData.get("baggageCost") as string) || 0,
      totalCost: Number.parseFloat(formData.get("totalCost") as string) || 0,
    }

    // Validate service type is provided
    if (!rawData.serviceType) {
      throw new Error("Jenis layanan harus dipilih")
    }

    // Use appropriate schema based on service type
    const schema = rawData.serviceType === "pick_up" ? pickupBookingSchema : bookingSchema
    const validatedData = schema.parse(rawData)

    // Get schedule details for advance booking validation
    const supabaseAdmin = await getSupabaseAdmin()
    const { data: schedule, error: scheduleError } = await supabaseAdmin
      .from('daily_schedules')
      .select(`
        schedule_date,
        departure_time,
        service_type,
        bus_schedules (
          departure_time
        )
      `)
      .eq('id', validatedData.scheduleId)
      .single()

    if (scheduleError || !schedule) {
      throw new Error("Jadwal tidak ditemukan")
    }

    // Validate service type matches schedule
    if (schedule.service_type && schedule.service_type !== validatedData.serviceType) {
      throw new Error("Jenis layanan tidak sesuai dengan jadwal yang dipilih")
    }

    // Create departure datetime for advance booking validation
    const busSchedule = Array.isArray(schedule.bus_schedules)
      ? schedule.bus_schedules[0]
      : schedule.bus_schedules
    const departureTime = schedule.departure_time || busSchedule?.departure_time
    if (departureTime) {
      const departureDateTime = new Date(`${schedule.schedule_date}T${departureTime}`)

      // Validate advance booking requirement (minimum 20 minutes prior)
      if (!validateAdvanceBooking(departureDateTime)) {
        throw new Error("Booking harus dilakukan minimal 20 menit sebelum keberangkatan")
      }
    }

    // Call Edge Function with anon key (public booking)
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/booking`

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      },
      body: JSON.stringify({
        ...validatedData,
        hasWhatsapp: rawData.hasWhatsapp,
        countryCode: rawData.countryCode,
        idempotencyKey: rawData.idempotencyKey,
      })
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Gagal membuat booking')
    }

    // Redirect ke halaman konfirmasi
    redirect(`/booking/confirmation?code=${result.data.bookingCode}`)
  } catch (error) {
    console.error("Booking error:", error)
    throw error
  }
}

// New function for optimistic booking - returns booking code without redirect
export async function createBookingOptimistic(formData: FormData) {
  if (!formData) {
    return { success: false, error: "formData is null" }
  }

  const customerName = formData.get("customerName")
  if (!customerName) {
    return { success: false, error: "Nama lengkap harus diisi" }
  }

  try {
    // Extract data from form
    const rawData = {
      customerName: formData.get("customerName") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      bookingDate: formData.get("bookingDate") as string,
      scheduleId: formData.get("scheduleId") as string,
      passengerCount: Number.parseInt(formData.get("passengerCount") as string),
      idempotencyKey: formData.get("idempotencyKey") as string,
      countryCode: (formData.get("countryCode") as string) || "62",
      serviceType: formData.get("serviceType") as "drop_off" | "pick_up",
      terminalCode: formData.get("terminalCode") as string | undefined,
      meetingPointId: formData.get("meetingPointId") as string | undefined,
      // Enhanced booking fields
      roomNumber: formData.get("roomNumber") as string | undefined,
      flightNumber: formData.get("flightNumber") as string | undefined,
      hasSurfboard: (formData.get("hasSurfboard") as string) === "true",
      surfboardCount: Number.parseInt(formData.get("surfboardCount") as string) || 0,
      hasExcessBaggage: (formData.get("hasExcessBaggage") as string) === "true",
      excessBaggageCount: Number.parseInt(formData.get("excessBaggageCount") as string) || 0, // Keep for backward compatibility
      surfboardCost: Number.parseFloat(formData.get("surfboardCost") as string) || 0,
      baggageCost: Number.parseFloat(formData.get("baggageCost") as string) || 0,
      totalCost: Number.parseFloat(formData.get("totalCost") as string) || 0,
    }

    // Validate service type is provided
    if (!rawData.serviceType) {
      return { success: false, error: "Jenis layanan harus dipilih" }
    }

    // Use appropriate schema based on service type
    const schema = rawData.serviceType === "pick_up" ? pickupBookingSchema : bookingSchema
    const validatedData = schema.parse(rawData)

    // Get schedule details for advance booking validation
    const supabaseAdmin = await getSupabaseAdmin()
    const { data: schedule, error: scheduleError } = await supabaseAdmin
      .from('daily_schedules')
      .select(`
        schedule_date,
        departure_time,
        service_type,
        bus_schedules (
          departure_time
        )
      `)
      .eq('id', validatedData.scheduleId)
      .single()

    if (scheduleError || !schedule) {
      return { success: false, error: "Jadwal tidak ditemukan" }
    }

    // Validate service type matches schedule
    if (schedule.service_type && schedule.service_type !== validatedData.serviceType) {
      return { success: false, error: "Jenis layanan tidak sesuai dengan jadwal yang dipilih" }
    }

    // Create departure datetime for advance booking validation
    const busSchedule = Array.isArray(schedule.bus_schedules)
      ? schedule.bus_schedules[0]
      : schedule.bus_schedules
    const departureTime = schedule.departure_time || busSchedule?.departure_time
    if (departureTime) {
      const departureDateTime = new Date(`${schedule.schedule_date}T${departureTime}`)

      // Validate advance booking requirement (minimum 20 minutes prior)
      if (!validateAdvanceBooking(departureDateTime)) {
        return { success: false, error: "Booking harus dilakukan minimal 20 menit sebelum keberangkatan" }
      }
    }

    // Call Edge Function with anon key (public booking)
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/booking`

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      },
      body: JSON.stringify({
        ...validatedData,
        hasWhatsapp: rawData.hasWhatsapp,
        countryCode: rawData.countryCode,
        idempotencyKey: rawData.idempotencyKey,
      })
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      return { success: false, error: result.error || 'Gagal membuat booking' }
    }

    return { success: true, bookingCode: result.data.bookingCode }
  } catch (error: any) {
    console.error("Booking error:", error)
    return { success: false, error: error?.message || "Booking failed" }
  }
}

/**
 * Get booking by code - now proxies to Edge Function
 */
export async function getBookingByCode(code: string) {
  let attempts = 0
  const maxAttempts = 3

  while (attempts < maxAttempts) {
    try {
      // Call Edge Function with anon key (public access)
      const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/booking-status?code=${encodeURIComponent(code)}`

      const response = await fetch(edgeFunctionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        },
        cache: 'no-store' // Ensure fresh data
      })

      const result = await response.json()

      if (response.ok && result.ok && result.found) {
        return {
          found: true,
          booking: result.booking
        }
      }

      // If not found or error, wait and retry
      attempts++
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error(`Error getting booking by code (attempt ${attempts + 1}):`, error)
      attempts++
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  return { found: false, booking: null }
}

export async function getHotelDetails(hotelId: string) {
  try {
    const supabaseAdmin = await getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from("hotels")
      .select("*")
      .eq("id", hotelId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error getting hotel details:", error)
    throw error
  }
}

export async function getTerminalMeetingPoints() {
  try {
    const supabaseAdmin = await getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from("terminal_meeting_points")
      .select("*")
      .order("terminal_code")

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting terminal meeting points:", error)
    throw error
  }
}

export async function getActivePricingConfig() {
  try {
    const supabaseAdmin = await getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from("pricing_config")
      .select("*")
      .eq("is_active", true)
      .order("effective_date", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error("Error getting pricing config:", error)
      // Return default configuration if database fails
      return {
        id: 'default',
        surfboard_cost_per_board: 75000,
        baggage_free_items_per_passenger: 2,
        baggage_terminal3_curbside_cost: 150000,
        baggage_other_terminals_cost: 75000,
        currency: 'IDR',
        effective_date: new Date().toISOString(),
        created_by: 'system',
        created_at: new Date().toISOString(),
        is_active: true
      }
    }

    return data
  } catch (error) {
    console.error("Error in getActivePricingConfig:", error)
    // Return default configuration as fallback
    return {
      id: 'default',
      surfboard_cost_per_board: 75000,
      baggage_free_items_per_passenger: 2,
      baggage_terminal3_curbside_cost: 150000,
      baggage_other_terminals_cost: 75000,
      currency: 'IDR',
      effective_date: new Date().toISOString(),
      created_by: 'system',
      created_at: new Date().toISOString(),
      is_active: true
    }
  }
}

export async function calculateBookingCosts(
  surfboardCount: number = 0,
  excessBaggageCount: number = 0,
  terminalCode?: string
) {
  try {
    const supabaseAdmin = await getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .rpc('calculate_booking_costs', {
        p_surfboard_count: surfboardCount,
        p_excess_baggage_count: excessBaggageCount,
        p_terminal: terminalCode || null
      })

    if (error) {
      console.error("Error calculating booking costs:", error)
      // Fallback to manual calculation
      const config = await getActivePricingConfig()
      const surfboardCost = surfboardCount * config.surfboard_cost_per_board
      const isTerminal3 = terminalCode === 'Terminal 3' || terminalCode === 'terminal3' || terminalCode === 'T3'
      const baggageCost = excessBaggageCount > 0 ?
        (isTerminal3 ? config.baggage_terminal3_curbside_cost : config.baggage_other_terminals_cost) : 0
      const totalCost = surfboardCost + baggageCost

      return [{
        surfboard_cost: surfboardCost,
        baggage_cost: baggageCost,
        total_cost: totalCost
      }]
    }

    return data || []
  } catch (error) {
    console.error("Error in calculateBookingCosts:", error)
    throw error
  }
}

export async function getAvailableSchedules(
  hotelSlug: string,
  date: string,
  serviceType?: "drop_off" | "pick_up"
) {
  try {
    const supabaseAdmin = await getSupabaseAdmin()

    // Convert URL slug to database format
    const dbHotelSlug = hotelSlug === "ibis-styles" ? "ibis_style" :
      hotelSlug === "ibis-budget" ? "ibis_budget" : hotelSlug

    let query = supabaseAdmin
      .from("daily_schedules")
      .select(`
        id,
        schedule_date,
        current_booked,
        status,
        service_type,
        departure_time,
        capacity,
        hotel,
        bus_schedules (
          departure_time,
          destination,
          max_capacity
        )
      `)
      .eq("schedule_date", date)
      .eq("hotel", dbHotelSlug)
      .eq("status", "active")

    // Filter by service type if provided
    if (serviceType) {
      query = query.eq("service_type", serviceType)
    }

    const { data, error } = await query.order("departure_time")

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error getting available schedules:", error)
    throw error
  }
}
