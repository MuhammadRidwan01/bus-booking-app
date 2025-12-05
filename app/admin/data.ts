import { getSupabaseAdmin } from "@/lib/supabase-server"
import { addDays, formatISO, parseISO } from "date-fns"
import { format } from "date-fns"
import type { BookingDetails, Hotel } from "@/types"

export interface BookingFilters {
  startDate?: string
  endDate?: string
  hotelId?: string
  status?: string
  waStatus?: "all" | "sent" | "failed" | "not_tried"
  search?: string
  limit?: number
}

export async function getAdminDashboardData() {
  const supabase = await getSupabaseAdmin()
  const today = format(new Date(), "yyyy-MM-dd")
  const sevenDaysAgo = format(addDays(new Date(), -7), "yyyy-MM-dd")
  const yesterdayIso = addDays(new Date(), -1).toISOString()

  const { count: bookingsToday } = await supabase
    .from("booking_details")
    .select("id", { count: "exact", head: true })
    .eq("schedule_date", today)

  const { data: passengersData } = await supabase
    .from("booking_details")
    .select("passenger_count")
    .eq("schedule_date", today)

  const passengersToday = passengersData?.reduce((sum, row) => sum + (row.passenger_count ?? 0), 0) ?? 0

  const { data: waData } = await supabase
    .from("booking_details")
    .select("whatsapp_sent")
    .gte("schedule_date", sevenDaysAgo)

  const totalWa = waData?.length ?? 0
  const waSuccess = waData?.filter((row) => row.whatsapp_sent)?.length ?? 0
  const waSuccessRate = totalWa > 0 ? Math.round((waSuccess / totalWa) * 100) : 0

  const { count: pendingSendQueue } = await supabase
    .from("booking_details")
    .select("id", { count: "exact", head: true })
    .eq("whatsapp_sent", false)

  const { count: waFailed24h } = await supabase
    .from("booking_details")
    .select("id", { count: "exact", head: true })
    .eq("whatsapp_sent", false)
    .gt("whatsapp_attempts", 0)
    .gte("created_at", yesterdayIso)

  const { count: activeSchedules } = await supabase
    .from("daily_schedules")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")

  const { data: upcoming } = await supabase
    .from("daily_schedules")
    .select(
      `id, schedule_date, current_booked, status,
      bus_schedules ( departure_time, destination, max_capacity, hotels ( id, name ) )`
    )
    .in("status", ["active", "full"])
    .gte("schedule_date", today)
    .lte("schedule_date", format(addDays(new Date(), 1), "yyyy-MM-dd"))
    .limit(12)
    .order("schedule_date", { ascending: true })

  const { data: last7Bookings } = await supabase
    .from("booking_details")
    .select("id, created_at")
    .gte("created_at", formatISO(addDays(new Date(), -6)))

  return {
    bookingsToday: bookingsToday ?? 0,
    passengersToday,
    waSuccessRate,
    waFailed24h: waFailed24h ?? 0,
    pendingSendQueue: pendingSendQueue ?? 0,
    activeSchedules: activeSchedules ?? 0,
    trendBookings: build7dTrend(last7Bookings ?? []),
    upcoming: (upcoming ?? []).map((row) => ({
      id: row.id,
      schedule_date: row.schedule_date,
      current_booked: row.current_booked,
      status: row.status,
      departure_time: (row.bus_schedules as any)?.departure_time,
      destination: (row.bus_schedules as any)?.destination,
      max_capacity: (row.bus_schedules as any)?.max_capacity,
      hotel_name: (row.bus_schedules as any)?.hotels?.name,
    })),
  }
}

function build7dTrend(rows: Array<{ created_at: string }>) {
  const days: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = format(addDays(new Date(), -i), "yyyy-MM-dd")
    days[d] = 0
  }
  rows.forEach((row) => {
    const d = format(new Date(row.created_at), "yyyy-MM-dd")
    if (days[d] !== undefined) days[d] += 1
  })
  return Object.entries(days).map(([date, count]) => ({ date, count }))
}

export async function getHotels(): Promise<Hotel[]> {
  const supabase = await getSupabaseAdmin()
  const { data } = await supabase
    .from("hotels")
    .select("id, name, slug, is_active")
    .order("name")
  return data ?? []
}

export async function getBookings(filters: BookingFilters): Promise<BookingDetails[]> {
  const supabase = await getSupabaseAdmin()
  const buildViewQuery = () => {
    let query = supabase
      .from("booking_details")
      .select("*")
      .order("created_at", { ascending: false })

    if (filters.startDate) {
      query = query.gte("schedule_date", filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte("schedule_date", filters.endDate)
    }
    if (filters.hotelId) {
      query = query.eq("hotel_id", filters.hotelId)
    }
    if (filters.status) {
      query = query.eq("status", filters.status)
    }
    if (filters.waStatus === "sent") {
      query = query.eq("whatsapp_sent", true)
    } else if (filters.waStatus === "failed") {
      query = query.eq("whatsapp_sent", false).gt("whatsapp_attempts", 0)
    } else if (filters.waStatus === "not_tried") {
      query = query.eq("whatsapp_attempts", 0)
    }
    if (filters.search) {
      query = query.or(
        `booking_code.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
      )
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    } else {
      query = query.limit(200)
    }
    return query
  }

  const attempt = await buildViewQuery()
  if (!attempt.error) return attempt.data ?? []

  // Fallback if booking_details view is missing columns
  if (attempt.error?.code === "42703") {
    let query = supabase
      .from("bookings")
      .select(
        `id, booking_code, hotel_id, daily_schedule_id, customer_name, phone, passenger_count, status, whatsapp_sent, whatsapp_attempts, whatsapp_last_error, room_number, created_at,
         daily_schedules ( schedule_date, bus_schedules ( departure_time, destination, max_capacity, hotels ( id, name ) ) )`
      )
      .order("created_at", { ascending: false })

    if (filters.startDate) query = query.gte("daily_schedules.schedule_date", filters.startDate)
    if (filters.endDate) query = query.lte("daily_schedules.schedule_date", filters.endDate)
    if (filters.hotelId) query = query.eq("daily_schedules.bus_schedules.hotels.id", filters.hotelId)
    if (filters.status) query = query.eq("status", filters.status)
    if (filters.waStatus === "sent") query = query.eq("whatsapp_sent", true)
    else if (filters.waStatus === "failed") query = query.eq("whatsapp_sent", false).gt("whatsapp_attempts", 0)
    else if (filters.waStatus === "not_tried") query = query.eq("whatsapp_attempts", 0)
    if (filters.search) {
      query = query.or(
        `booking_code.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
      )
    }
    if (filters.limit) query = query.limit(filters.limit)
    else query = query.limit(200)

    const { data, error } = await query
    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map((row: any) => ({
      ...row,
      schedule_date: row.daily_schedules?.schedule_date ?? "",
      departure_time: row.daily_schedules?.bus_schedules?.departure_time ?? "",
      destination: row.daily_schedules?.bus_schedules?.destination ?? "",
      hotel_name: row.daily_schedules?.bus_schedules?.hotels?.name ?? "",
    }))
  }

  if (attempt.error) {
    throw new Error(attempt.error.message)
  }

  return attempt.data ?? []
}

export async function getSchedules(filters: {
  startDate?: string
  endDate?: string
  hotelId?: string
  status?: string
}): Promise<any[]> {
  const supabase = await getSupabaseAdmin()
  let query = supabase
    .from("daily_schedules")
    .select(
      `id, schedule_date, current_booked, status,
      bus_schedules ( id, departure_time, destination, max_capacity, hotel_id, hotels ( id, name ) )`
    )
    .order("schedule_date", { ascending: true })
    .order("bus_schedule_id", { ascending: true })

  if (filters.startDate) query = query.gte("schedule_date", filters.startDate)
  if (filters.endDate) query = query.lte("schedule_date", filters.endDate)
  if (filters.status) query = query.eq("status", filters.status)
  if (filters.hotelId) query = query.eq("bus_schedules.hotel_id", filters.hotelId)

  const { data } = await query
  return (data ?? []).map((row) => ({
    id: row.id,
    schedule_date: row.schedule_date,
    current_booked: row.current_booked,
    status: row.status,
    departure_time: (row.bus_schedules as any)?.departure_time,
    destination: (row.bus_schedules as any)?.destination,
    max_capacity: (row.bus_schedules as any)?.max_capacity,
    hotel_name: (row.bus_schedules as any)?.hotels?.name,
    hotel_id: (row.bus_schedules as any)?.hotel_id,
  }))
}

export async function previewGenerateSchedules(startDate: string, days: number) {
  const supabase = await getSupabaseAdmin()
  const { data: busTemplates } = await supabase
    .from("bus_schedules")
    .select("id, departure_time, destination, max_capacity, hotels(id, name)")
    .eq("is_active", true)

  const start = parseISO(startDate)
  const results: Array<{ date: string; hotel: string; departure_time: string; destination: string; max_capacity: number }> = []
  if (!busTemplates) return results

  for (let i = 0; i < days; i++) {
    const currentDate = formatISO(addDays(start, i), { representation: "date" })
    busTemplates.forEach((tpl) => {
      results.push({
        date: currentDate,
        hotel: (tpl as any).hotels?.name ?? "",
        departure_time: tpl.departure_time,
        destination: tpl.destination,
        max_capacity: tpl.max_capacity,
      })
    })
  }

  return results
}

export async function getSystemHealthData() {
  const supabase = await getSupabaseAdmin()
  const today = format(new Date(), "yyyy-MM-dd")
  const yesterdayIso = addDays(new Date(), -1).toISOString()

  const [overdueSchedulesRes, waFailuresRes, pendingSendRes, logsRes, latestBookingRes, hotSchedulesRes] = await Promise.all([
    supabase
      .from("daily_schedules")
      .select(
        `id, schedule_date, current_booked, status,
        bus_schedules ( destination, departure_time, max_capacity, hotels(name) )`
      )
      .lt("schedule_date", today)
      .eq("status", "active")
      .limit(8)
      .order("schedule_date", { ascending: true }),
    supabase
      .from("booking_details")
      .select("id, booking_code, customer_name, phone, whatsapp_last_error, created_at")
      .eq("whatsapp_sent", false)
      .gt("whatsapp_attempts", 0)
      .gte("created_at", yesterdayIso)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("booking_details")
      .select("id", { count: "exact", head: true })
      .eq("whatsapp_sent", false),
    supabase
      .from("admin_logs")
      .select("id, action, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("booking_details")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("daily_schedules")
      .select(
        `id, schedule_date, current_booked, status,
        bus_schedules ( destination, departure_time, max_capacity, hotels(name) )`
      )
      .gte("schedule_date", today)
      .order("schedule_date", { ascending: true })
      .limit(12),
  ])

  const hotSchedules = (hotSchedulesRes.data ?? []).map((row) => {
    const maxCapacity = (row.bus_schedules as any)?.max_capacity ?? 0
    const occupancy = maxCapacity ? Math.round((row.current_booked / maxCapacity) * 100) : 0
    return {
      id: row.id,
      schedule_date: row.schedule_date,
      destination: (row.bus_schedules as any)?.destination,
      departure_time: (row.bus_schedules as any)?.departure_time,
      hotel_name: (row.bus_schedules as any)?.hotels?.name,
      occupancy,
    }
  }).filter((row) => row.occupancy >= 85)

  return {
    overdueSchedules: overdueSchedulesRes.data ?? [],
    waFailures: waFailuresRes.data ?? [],
    pendingSendQueue: pendingSendRes.count ?? 0,
    logs: logsRes.data ?? [],
    latestBookingAt: latestBookingRes.data?.created_at ?? null,
    hotSchedules,
  }
}

export async function getSendQueue() {
  const supabase = await getSupabaseAdmin()
  const { data } = await supabase
    .from("booking_details")
    .select("id, booking_code, customer_name, phone, schedule_date, departure_time, destination, whatsapp_sent, whatsapp_attempts, whatsapp_last_error, created_at")
    .eq("whatsapp_sent", false)
    .order("created_at", { ascending: false })
    .limit(300)

  return data ?? []
}
