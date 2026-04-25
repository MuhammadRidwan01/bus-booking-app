"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { normalizeTo62 } from "@/lib/phone"
import { formatDate, formatTime } from "@/lib/utils"
import { previewGenerateSchedules } from "./data"
import { addDays, formatISO } from "date-fns"
import type { BookingDetails } from "@/types"

async function logAdminAction(action: string, meta?: Record<string, unknown>) {
  try {
    const supabase = await getSupabaseAdmin()
    await supabase.from("admin_logs").insert({ action, meta })
  } catch (error) {
    console.error("Failed to log admin action", error)
  }
}

export async function resendWhatsapp(bookingId: string) {
  return { ok: false, error: "WhatsApp integration has been removed" }
}

export async function cancelBooking(bookingId: string) {
  const supabase = await getSupabaseAdmin()
  // Fetch detail before cancellation for notification
  const { data: bookingDetail } = await supabase
    .from("booking_details")
    .select("booking_code, customer_name, phone, schedule_date, departure_time, destination, hotel_name, has_whatsapp, whatsapp_attempts, service_type, terminal_code, meeting_point_location, arrival_time_offset_min, arrival_time_offset_max")
    .eq("id", bookingId)
    .maybeSingle()

  const { data, error } = await supabase.rpc("cancel_booking_and_release_capacity", { p_booking_id: bookingId })

  if (error) {
    await logAdminAction("CANCEL_BOOKING_FAIL", { booking_id: bookingId, error: error.message })
    return { ok: false, error: error.message }
  }

  await logAdminAction("CANCEL_BOOKING", { booking_id: bookingId })
  revalidatePath("/admin/bookings")
  revalidatePath("/admin/schedules")


  return { ok: true, data }
}

export async function exportBookingsCsv(filters: Record<string, any>) {
  const supabase = await getSupabaseAdmin()
  const buildViewQuery = () => {
    let query = supabase
      .from("booking_details")
      .select("*")
      .order("created_at", { ascending: false })

    if (filters.startDate) query = query.gte("schedule_date", filters.startDate)
    if (filters.endDate) query = query.lte("schedule_date", filters.endDate)
    if (filters.hotelId) query = query.eq("hotel_id", filters.hotelId)
    if (filters.status) query = query.eq("status", filters.status)

    const waStatus = filters.waStatus as string | undefined
    if (waStatus === "sent") query = query.eq("whatsapp_sent", true)
    if (waStatus === "failed") query = query.eq("whatsapp_sent", false).gt("whatsapp_attempts", 0)
    if (waStatus === "not_tried") query = query.eq("whatsapp_attempts", 0)

    if (filters.search) query = query.or(`booking_code.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    if (filters.dailyScheduleId) query = query.eq("daily_schedule_id", filters.dailyScheduleId)
    return query.limit(1000)
  }

  const attempt = await buildViewQuery()
  let rows = attempt.data ?? []

  if (attempt.error?.code === "42703") {
    let query = supabase
      .from("bookings")
      .select(
        `booking_code, created_at, customer_name, phone, passenger_count, status, whatsapp_sent, whatsapp_attempts, daily_schedule_id,
         daily_schedules ( schedule_date, bus_schedules ( destination, departure_time, hotels ( name ) ) )`
      )
      .order("created_at", { ascending: false })
    if (filters.startDate) query = query.gte("daily_schedules.schedule_date", filters.startDate)
    if (filters.endDate) query = query.lte("daily_schedules.schedule_date", filters.endDate)
    if (filters.hotelId) query = query.eq("daily_schedules.bus_schedules.hotels.id", filters.hotelId)
    if (filters.status) query = query.eq("status", filters.status)
    const waStatus = filters.waStatus as string | undefined
    if (waStatus === "sent") query = query.eq("whatsapp_sent", true)
    if (waStatus === "failed") query = query.eq("whatsapp_sent", false).gt("whatsapp_attempts", 0)
    if (waStatus === "not_tried") query = query.eq("whatsapp_attempts", 0)
    if (filters.search) query = query.or(`booking_code.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    if (filters.dailyScheduleId) query = query.eq("daily_schedule_id", filters.dailyScheduleId)
    query = query.limit(1000)

    const { data, error } = await query
    if (error) {
      throw new Error(error.message)
    }
    rows = (data ?? []).map((r: any) => ({
      ...r,
      hotel_name: r.daily_schedules?.bus_schedules?.hotels?.name ?? "",
      schedule_date: r.daily_schedules?.schedule_date ?? "",
      departure_time: r.daily_schedules?.bus_schedules?.departure_time ?? "",
      destination: r.daily_schedules?.bus_schedules?.destination ?? "",
    }))
  }

  const header = [
    "booking_code",
    "created_at",
    "hotel_name",
    "schedule_date",
    "departure_time",
    "destination",
    "customer_name",
    "phone",
    "passenger_count",
    "status",
    "whatsapp_sent",
    "whatsapp_attempts",
  ]

  const csv = [
    header.join(","),
    ...rows.map((r) => [
      r.booking_code,
      r.created_at,
      r.hotel_name,
      r.schedule_date,
      r.departure_time,
      r.destination,
      r.customer_name,
      r.phone,
      r.passenger_count,
      r.status,
      r.whatsapp_sent,
      r.whatsapp_attempts,
    ].map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n")

  await logAdminAction("EXPORT_BOOKINGS", { ...filters, count: rows.length })
  return csv
}

export async function fetchPassengerHistory(phone: string) {
  const supabase = await getSupabaseAdmin()
  const attempt = await supabase
    .from("booking_details")
    .select("booking_code, schedule_date, status")
    .eq("phone", phone)
    .order("schedule_date", { ascending: false })
    .limit(5)

  if (!attempt.error) return attempt.data ?? []

  if (attempt.error?.code === "42703") {
    const { data, error } = await supabase
      .from("bookings")
      .select("booking_code, status, daily_schedules ( schedule_date )")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(5)
    if (error) return []
    return (data ?? []).map((r: any) => ({
      booking_code: r.booking_code,
      status: r.status,
      schedule_date: r.daily_schedules?.schedule_date ?? null,
    }))
  }

  return []
}

export async function runDailyMaintenance() {
  const baseUrl = process.env.APP_BASE_URL
  const cronSecret = process.env.CRON_SECRET
  if (!baseUrl || !cronSecret) {
    return { ok: false, error: "APP_BASE_URL atau CRON_SECRET belum di-set" }
  }

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/cron/daily-maintenance`, {
    headers: { Authorization: `Bearer ${cronSecret}` },
  })

  const data = await res.json().catch(() => null)
  await logAdminAction("RUN_DAILY_MAINTENANCE", { status: res.status })

  if (!res.ok) return { ok: false, error: data?.error ?? "Gagal menjalankan daily maintenance" }
  return { ok: true, data }
}

export async function runCleanupExpiredSchedules() {
  const supabase = await getSupabaseAdmin()
  const { error } = await supabase.rpc("cleanup_expired_schedules")
  await logAdminAction("RUN_CLEANUP_EXPIRED", { ok: !error })
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/schedules")
  return { ok: true }
}

export async function runGenerateSchedules(days: number, startDate?: string) {
  // Existing RPC has no params; we still log intent
  const supabase = await getSupabaseAdmin()
  const { error } = await supabase.rpc("generate_daily_schedules", {})
  await logAdminAction("RUN_GENERATE_SCHEDULES", { days, startDate })
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/schedules")
  return { ok: true }
}

export async function generateSchedulesFromTemplates(days: number, startDate?: string) {
  const supabase = await getSupabaseAdmin()
  
  // Get active schedule templates
  const { data: templates, error: templatesError } = await supabase
    .from("schedule_templates")
    .select(`
      id, service_type, hotel,
      schedule_times (
        departure_time, capacity, is_active
      )
    `)
    .eq("is_active", true)

  if (templatesError) {
    await logAdminAction("GENERATE_FROM_TEMPLATES", { ok: false, error: templatesError.message })
    return { ok: false, error: templatesError.message }
  }

  if (!templates || templates.length === 0) {
    return { ok: false, error: "No active schedule templates found" }
  }

  const start = startDate ? new Date(startDate) : addDays(new Date(), 1)
  const schedules: any[] = []

  // Generate schedules for each day
  for (let i = 0; i < days; i++) {
    const currentDate = formatISO(addDays(start, i), { representation: "date" })
    
    // Generate schedules for each template
    for (const template of templates) {
      const activeTimes = (template.schedule_times as any[]).filter(t => t.is_active)
      
      for (const time of activeTimes) {
        schedules.push({
          schedule_date: currentDate,
          service_type: template.service_type,
          hotel: template.hotel,
          departure_time: time.departure_time,
          capacity: time.capacity,
          current_bookings: 0,
          is_active: true,
          template_id: template.id,
        })
      }
    }
  }

  if (schedules.length === 0) {
    return { ok: false, error: "No schedules to generate" }
  }

  // Insert the generated schedules
  const { error: insertError } = await supabase
    .from("daily_schedules")
    .upsert(schedules, { 
      onConflict: "schedule_date,service_type,hotel,departure_time",
      ignoreDuplicates: true 
    })

  await logAdminAction("GENERATE_FROM_TEMPLATES", { 
    ok: !insertError, 
    days, 
    startDate, 
    templates_count: templates.length,
    schedules_count: schedules.length 
  })
  
  if (insertError) return { ok: false, error: insertError.message }
  
  revalidatePath("/admin/schedules")
  return { ok: true, data: { generated: schedules.length } }
}

export async function getSchedulePreview(startDate: string, days: number) {
  const preview = await previewGenerateSchedules(startDate, days)
  await logAdminAction("PREVIEW_GENERATE_SCHEDULES", { startDate, days, count: preview.length })
  return preview
}

export async function fetchSendQueueAction(filter?: { mode?: "all" | "pending" | "failed" }) {
  // WhatsApp feature removed
  return []
}

export async function quickSearch(query: string) {
  const supabase = await getSupabaseAdmin()
  const { data: bookings } = await supabase
    .from("booking_details")
    .select("id, booking_code, phone, customer_name, hotel_name")
    .or(`booking_code.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(5)

  const { data: hotels } = await supabase
    .from("hotels")
    .select("id, name")
    .ilike("name", `%${query}%`)
    .limit(5)

  return { bookings: bookings ?? [], hotels: hotels ?? [] }
}

export async function fetchBookingsAction(filters: Record<string, any>) {
  const supabase = await getSupabaseAdmin()
  let query = supabase.from("booking_details").select("*").order("created_at", { ascending: false })

  if (filters.startDate) query = query.gte("schedule_date", filters.startDate)
  if (filters.endDate) query = query.lte("schedule_date", filters.endDate)
  if (filters.hotelId) query = query.eq("hotel_id", filters.hotelId)
  if (filters.status) query = query.eq("status", filters.status)

  const waStatus = filters.waStatus as string | undefined
  if (waStatus === "sent") query = query.eq("whatsapp_sent", true)
  if (waStatus === "failed") query = query.eq("whatsapp_sent", false).gt("whatsapp_attempts", 0)
  if (waStatus === "not_tried") query = query.eq("whatsapp_attempts", 0)

  if (filters.search) query = query.or(`booking_code.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)

  // Enhanced search filters
  if (filters.roomNumber) query = query.ilike("room_number", `%${filters.roomNumber}%`)
  if (filters.flightNumber) query = query.ilike("flight_number", `%${filters.flightNumber}%`)
  if (filters.hasSurfboard === true) {
    query = query.eq("has_surfboard", true).gt("surfboard_count", 0)
  } else if (filters.hasSurfboard === false) {
    query = query.or("has_surfboard.is.null,has_surfboard.eq.false,surfboard_count.eq.0")
  }
  if (filters.hasExcessBaggage === true) {
    query = query.gt("excess_baggage_count", 0)
  } else if (filters.hasExcessBaggage === false) {
    query = query.or("excess_baggage_count.is.null,excess_baggage_count.eq.0")
  }
  if (filters.minCost !== undefined) {
    query = query.gte("total_cost", filters.minCost)
  }
  if (filters.maxCost !== undefined) {
    query = query.lte("total_cost", filters.maxCost)
  }

  const limit = filters.limit ? Number(filters.limit) : 200
  query = query.limit(limit)

  const { data } = await query
  return data ?? []
}

export async function fetchSchedulesAction(filters: Record<string, any>) {
  const supabase = await getSupabaseAdmin()
  let query = supabase
    .from("daily_schedules")
    .select(`id, schedule_date, current_booked, status, service_type, bus_schedules ( id, departure_time, destination, max_capacity, hotel_id, hotels ( id, name ) )`)
    .order("schedule_date", { ascending: true })
    .order("bus_schedule_id", { ascending: true })

  if (filters.startDate) query = query.gte("schedule_date", filters.startDate)
  if (filters.endDate) query = query.lte("schedule_date", filters.endDate)
  if (filters.status) query = query.eq("status", filters.status)
  if (filters.hotelId) query = query.eq("bus_schedules.hotel_id", filters.hotelId)
  if (filters.serviceType) query = query.eq("service_type", filters.serviceType)

  const { data } = await query
  return (data ?? []).map((row) => ({
    id: row.id,
    schedule_date: row.schedule_date,
    current_booked: row.current_booked,
    status: row.status,
    service_type: row.service_type,
    departure_time: (row.bus_schedules as any)?.departure_time,
    destination: (row.bus_schedules as any)?.destination,
    max_capacity: (row.bus_schedules as any)?.max_capacity,
    hotel_name: (row.bus_schedules as any)?.hotels?.name,
    hotel_id: (row.bus_schedules as any)?.hotel_id,
  }))
}

export async function cancelSchedule(scheduleId: string) {
  const supabase = await getSupabaseAdmin()

  // Get schedule with hotel info
  const { data: schedule } = await supabase
    .from("daily_schedules")
    .select(`
      id, schedule_date, status,
      bus_schedules (
        departure_time,
        destination,
        hotels ( name )
      )
    `)
    .eq("id", scheduleId)
    .single()

  if (!schedule) return { ok: false, error: "Schedule tidak ditemukan" }

  const today = new Date()
  const scheduleDate = new Date(schedule.schedule_date)
  if (scheduleDate < new Date(today.toDateString())) {
    return { ok: false, error: "Tidak bisa membatalkan jadwal yang sudah lewat" }
  }

  // Get all confirmed bookings BEFORE cancelling (to send notifications)
  const { data: affectedBookings } = await supabase
    .from("booking_details")
    .select("id, booking_code, customer_name, phone, has_whatsapp, whatsapp_attempts, service_type, terminal_code, meeting_point_location, arrival_time_offset_min, arrival_time_offset_max")
    .eq("daily_schedule_id", scheduleId)
    .eq("status", "confirmed")

  // Cancel the schedule
  const { error } = await supabase
    .from("daily_schedules")
    .update({ status: "cancelled" })
    .eq("id", scheduleId)

  if (error) {
    await logAdminAction("CANCEL_SCHEDULE", { schedule_id: scheduleId, ok: false })
    return { ok: false, error: error.message }
  }

  // Cancel all confirmed bookings on this schedule
  const { data: cancelledBookings, error: bookingsError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("daily_schedule_id", scheduleId)
    .eq("status", "confirmed")
    .select("id, booking_code")

  if (bookingsError) {
    console.error("Error cancelling bookings:", bookingsError)
  }

  await logAdminAction("CANCEL_SCHEDULE", {
    schedule_id: scheduleId,
    ok: true,
    cancelled_bookings: cancelledBookings?.length ?? 0,
    notifications_sent: 0
  })

  revalidatePath("/admin/schedules")
  return {
    ok: true,
    cancelledBookings: cancelledBookings?.length ?? 0,
    notificationsSent: 0
  }
}



export async function exportPassengersCsv(scheduleId: string) {
  const supabase = await getSupabaseAdmin()
  const { data } = await supabase
    .from("booking_details")
    .select("booking_code, customer_name, phone, passenger_count, flight_number, schedule_date, departure_time")
    .eq("daily_schedule_id", scheduleId)

  const rows = data ?? []
  const header = ["booking_code", "customer_name", "phone", "passenger_count", "flight_number", "schedule_date", "departure_time"]
  const csv = [
    header.join(","),
    ...rows.map((r) =>
      header.map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n")
  await logAdminAction("EXPORT_PASSENGERS", { schedule_id: scheduleId, count: rows.length })
  return csv
}

export async function createBusSchedule(payload: {
  hotelId: string
  departureTime: string
  destination: string
  maxCapacity: number
  isActive: boolean
}) {
  const supabase = await getSupabaseAdmin()
  const { error } = await supabase.from("bus_schedules").insert({
    hotel_id: payload.hotelId,
    departure_time: payload.departureTime,
    destination: payload.destination,
    max_capacity: payload.maxCapacity,
    is_active: payload.isActive,
  })
  await logAdminAction("CREATE_BUS_SCHEDULE", { ok: !error, hotel_id: payload.hotelId, destination: payload.destination })
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/bus-schedules")
  return { ok: true }
}

export async function updateBusSchedule(payload: {
  id: string
  hotelId: string
  departureTime: string
  destination: string
  maxCapacity: number
  isActive: boolean
}) {
  const supabase = await getSupabaseAdmin()

  // Safety: do not allow lowering capacity below current bookings
  const { data: maxRow } = await supabase
    .from("daily_schedules")
    .select("current_booked")
    .eq("bus_schedule_id", payload.id)
    .order("current_booked", { ascending: false })
    .limit(1)
    .single()

  const currentMaxBooked = maxRow?.current_booked ?? 0
  if (payload.maxCapacity < currentMaxBooked) {
    return { ok: false, error: `Cannot set capacity below current bookings (${currentMaxBooked}).` }
  }

  const { error } = await supabase
    .from("bus_schedules")
    .update({
      hotel_id: payload.hotelId,
      departure_time: payload.departureTime,
      destination: payload.destination,
      max_capacity: payload.maxCapacity,
      is_active: payload.isActive,
    })
    .eq("id", payload.id)

  await logAdminAction("UPDATE_BUS_SCHEDULE", { ok: !error, id: payload.id })
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/bus-schedules")
  revalidatePath("/admin/schedules")
  return { ok: true }
}

export async function toggleBusScheduleActive(id: string, isActive: boolean) {
  const supabase = await getSupabaseAdmin()
  const { error } = await supabase
    .from("bus_schedules")
    .update({ is_active: isActive })
    .eq("id", id)

  await logAdminAction("TOGGLE_BUS_SCHEDULE", { ok: !error, id, is_active: isActive })
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/bus-schedules")
  return { ok: true }
}

// Schedule Template Management Actions

export async function createScheduleTemplate(payload: {
  name: string
  service_type: 'drop_off' | 'pick_up'
  hotel: 'ibis_style' | 'ibis_budget'
  is_active: boolean
  schedule_times: Array<{
    departure_time: string
    capacity: number
    is_active: boolean
  }>
}) {
  const supabase = await getSupabaseAdmin()
  
  // Create the template
  const { data: template, error: templateError } = await supabase
    .from("schedule_templates")
    .insert({
      name: payload.name,
      service_type: payload.service_type,
      hotel: payload.hotel,
      is_active: payload.is_active,
    })
    .select("id")
    .single()

  if (templateError) {
    await logAdminAction("CREATE_SCHEDULE_TEMPLATE", { ok: false, error: templateError.message })
    return { ok: false, error: templateError.message }
  }

  // Create the schedule times
  if (payload.schedule_times.length > 0) {
    const { error: timesError } = await supabase
      .from("schedule_times")
      .insert(
        payload.schedule_times.map(time => ({
          template_id: template.id,
          departure_time: time.departure_time,
          capacity: time.capacity,
          is_active: time.is_active,
        }))
      )

    if (timesError) {
      // Cleanup: delete the template if times creation failed
      await supabase.from("schedule_templates").delete().eq("id", template.id)
      await logAdminAction("CREATE_SCHEDULE_TEMPLATE", { ok: false, error: timesError.message })
      return { ok: false, error: timesError.message }
    }
  }

  await logAdminAction("CREATE_SCHEDULE_TEMPLATE", { ok: true, template_id: template.id, name: payload.name })
  revalidatePath("/admin/schedule-templates")
  return { ok: true, data: template }
}

export async function updateScheduleTemplate(templateId: string, payload: {
  name: string
  service_type: 'drop_off' | 'pick_up'
  hotel: 'ibis_style' | 'ibis_budget'
  is_active: boolean
  schedule_times: Array<{
    id?: string
    departure_time: string
    capacity: number
    is_active: boolean
  }>
}) {
  const supabase = await getSupabaseAdmin()

  // Update the template
  const { error: templateError } = await supabase
    .from("schedule_templates")
    .update({
      name: payload.name,
      service_type: payload.service_type,
      hotel: payload.hotel,
      is_active: payload.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", templateId)

  if (templateError) {
    await logAdminAction("UPDATE_SCHEDULE_TEMPLATE", { ok: false, template_id: templateId, error: templateError.message })
    return { ok: false, error: templateError.message }
  }

  // Delete existing schedule times and recreate them
  const { error: deleteError } = await supabase
    .from("schedule_times")
    .delete()
    .eq("template_id", templateId)

  if (deleteError) {
    await logAdminAction("UPDATE_SCHEDULE_TEMPLATE", { ok: false, template_id: templateId, error: deleteError.message })
    return { ok: false, error: deleteError.message }
  }

  // Create new schedule times
  if (payload.schedule_times.length > 0) {
    const { error: timesError } = await supabase
      .from("schedule_times")
      .insert(
        payload.schedule_times.map(time => ({
          template_id: templateId,
          departure_time: time.departure_time,
          capacity: time.capacity,
          is_active: time.is_active,
        }))
      )

    if (timesError) {
      await logAdminAction("UPDATE_SCHEDULE_TEMPLATE", { ok: false, template_id: templateId, error: timesError.message })
      return { ok: false, error: timesError.message }
    }
  }

  await logAdminAction("UPDATE_SCHEDULE_TEMPLATE", { ok: true, template_id: templateId, name: payload.name })
  revalidatePath("/admin/schedule-templates")
  return { ok: true }
}

export async function deleteScheduleTemplate(templateId: string) {
  const supabase = await getSupabaseAdmin()

  // Check if template is being used in daily schedules
  const { data: usageCheck } = await supabase
    .from("daily_schedules")
    .select("id")
    .eq("template_id", templateId)
    .limit(1)

  if (usageCheck && usageCheck.length > 0) {
    return { ok: false, error: "Cannot delete template that is being used in daily schedules" }
  }

  // Delete the template (schedule_times will be deleted via CASCADE)
  const { error } = await supabase
    .from("schedule_templates")
    .delete()
    .eq("id", templateId)

  await logAdminAction("DELETE_SCHEDULE_TEMPLATE", { ok: !error, template_id: templateId })
  if (error) return { ok: false, error: error.message }
  
  revalidatePath("/admin/schedule-templates")
  return { ok: true }
}

export async function toggleScheduleTemplateActive(templateId: string, isActive: boolean) {
  const supabase = await getSupabaseAdmin()
  
  const { error } = await supabase
    .from("schedule_templates")
    .update({ 
      is_active: isActive,
      updated_at: new Date().toISOString()
    })
    .eq("id", templateId)

  await logAdminAction("TOGGLE_SCHEDULE_TEMPLATE", { ok: !error, template_id: templateId, is_active: isActive })
  if (error) return { ok: false, error: error.message }
  
  revalidatePath("/admin/schedule-templates")
  return { ok: true }
}

// Terminal Meeting Point Management Actions

export async function createTerminalMeetingPoint(payload: {
  terminal_code: string
  location_description: string
  arrival_time_offset_min: number
  arrival_time_offset_max: number
  is_active: boolean
}) {
  const supabase = await getSupabaseAdmin()
  
  // Check if terminal code already exists
  const { data: existing } = await supabase
    .from("terminal_meeting_points")
    .select("id")
    .eq("terminal_code", payload.terminal_code)
    .single()

  if (existing) {
    return { ok: false, error: `Terminal ${payload.terminal_code} already exists` }
  }

  const { error } = await supabase
    .from("terminal_meeting_points")
    .insert({
      terminal_code: payload.terminal_code,
      location_description: payload.location_description,
      arrival_time_offset_min: payload.arrival_time_offset_min,
      arrival_time_offset_max: payload.arrival_time_offset_max,
      is_active: payload.is_active,
    })

  await logAdminAction("CREATE_TERMINAL_MEETING_POINT", { ok: !error, terminal_code: payload.terminal_code })
  if (error) return { ok: false, error: error.message }
  
  revalidatePath("/admin/terminal-meeting-points")
  return { ok: true }
}

export async function updateTerminalMeetingPoint(pointId: string, payload: {
  terminal_code: string
  location_description: string
  arrival_time_offset_min: number
  arrival_time_offset_max: number
  is_active: boolean
}) {
  const supabase = await getSupabaseAdmin()

  // Check if terminal code already exists for a different point
  const { data: existing } = await supabase
    .from("terminal_meeting_points")
    .select("id")
    .eq("terminal_code", payload.terminal_code)
    .neq("id", pointId)
    .single()

  if (existing) {
    return { ok: false, error: `Terminal ${payload.terminal_code} already exists` }
  }

  const { error } = await supabase
    .from("terminal_meeting_points")
    .update({
      terminal_code: payload.terminal_code,
      location_description: payload.location_description,
      arrival_time_offset_min: payload.arrival_time_offset_min,
      arrival_time_offset_max: payload.arrival_time_offset_max,
      is_active: payload.is_active,
    })
    .eq("id", pointId)

  await logAdminAction("UPDATE_TERMINAL_MEETING_POINT", { ok: !error, point_id: pointId, terminal_code: payload.terminal_code })
  if (error) return { ok: false, error: error.message }
  
  revalidatePath("/admin/terminal-meeting-points")
  return { ok: true }
}

export async function deleteTerminalMeetingPoint(pointId: string) {
  const supabase = await getSupabaseAdmin()

  // Check if meeting point is being used in bookings
  const { data: usageCheck } = await supabase
    .from("bookings")
    .select("id")
    .eq("meeting_point_id", pointId)
    .limit(1)

  if (usageCheck && usageCheck.length > 0) {
    return { ok: false, error: "Cannot delete meeting point that is being used in bookings" }
  }

  const { error } = await supabase
    .from("terminal_meeting_points")
    .delete()
    .eq("id", pointId)

  await logAdminAction("DELETE_TERMINAL_MEETING_POINT", { ok: !error, point_id: pointId })
  if (error) return { ok: false, error: error.message }
  
  revalidatePath("/admin/terminal-meeting-points")
  return { ok: true }
}

export async function toggleTerminalMeetingPointActive(pointId: string, isActive: boolean) {
  const supabase = await getSupabaseAdmin()
  
  const { error } = await supabase
    .from("terminal_meeting_points")
    .update({ is_active: isActive })
    .eq("id", pointId)

  await logAdminAction("TOGGLE_TERMINAL_MEETING_POINT", { ok: !error, point_id: pointId, is_active: isActive })
  if (error) return { ok: false, error: error.message }
  
  revalidatePath("/admin/terminal-meeting-points")
  return { ok: true }
}
