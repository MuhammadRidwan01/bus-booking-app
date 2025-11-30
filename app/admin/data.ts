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

  return {
    bookingsToday: bookingsToday ?? 0,
    passengersToday,
    waSuccessRate,
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

  const { data } = await query
  return data ?? []
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
