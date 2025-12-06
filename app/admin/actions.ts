"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { normalizeTo62 } from "@/lib/phone"
import { sendWhatsappMessage } from "@/lib/whatsapp"
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
  const supabase = await getSupabaseAdmin()
  const { data: booking } = await supabase
    .from("booking_details")
    .select("*")
    .eq("id", bookingId)
    .single()

  if (!booking) {
    return { ok: false, error: "Booking tidak ditemukan" }
  }

  if ((booking as any).has_whatsapp === false) {
    return { ok: false, error: "Number marked inactive; WhatsApp skipped" }
  }

  const normalizedPhone = normalizeTo62(booking.phone)
  const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "") || ""
  const trackLink = `${baseUrl}/track?code=${booking.booking_code}`
  const pdfLink = `${baseUrl}/api/ticket/${booking.booking_code}`
  const messageParts = [
    `Halo ${booking.customer_name}, booking shuttle kamu sudah berhasil.`,
    `Hotel: ${booking.hotel_name ?? "Ibis Hotel"}`,
    booking.schedule_date ? `Tanggal: ${formatDate(booking.schedule_date)}` : null,
    booking.departure_time ? `Jam: ${formatTime(booking.departure_time)} WIB` : null,
    booking.destination ? `Tujuan: ${booking.destination}` : null,
    `Kode Booking: ${booking.booking_code}`,
    `Lacak tiket: ${trackLink}`,
    "Terima kasih.",
  ].filter(Boolean)
  const message = messageParts.join("\n")

  const waResult = await sendWhatsappMessage({
    phone: normalizedPhone,
    message,
    pdfUrl: pdfLink,
    caption: `Tiket Shuttle - ${booking.booking_code}`,
  })
  const waErrorMessage = waResult.ok ? null : (waResult.data as any)?.error ?? "Wablas send failed"

  await supabase
    .from("bookings")
    .update({
      whatsapp_attempts: (booking as any).whatsapp_attempts ? Number((booking as any).whatsapp_attempts) + 1 : 1,
      whatsapp_sent: waResult.ok,
      whatsapp_last_error: waResult.ok ? null : waErrorMessage,
    })
    .eq("id", bookingId)

  await logAdminAction("RESEND_WA", { booking_id: bookingId, ok: waResult.ok })
  revalidatePath("/admin/bookings")

  return waResult.ok
    ? { ok: true }
    : { ok: false, error: waErrorMessage ?? "Gagal kirim WA" }
}

export async function cancelBooking(bookingId: string) {
  const supabase = await getSupabaseAdmin()
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

export async function getSchedulePreview(startDate: string, days: number) {
  const preview = await previewGenerateSchedules(startDate, days)
  await logAdminAction("PREVIEW_GENERATE_SCHEDULES", { startDate, days, count: preview.length })
  return preview
}

export async function fetchSendQueueAction(filter?: { mode?: "all" | "pending" | "failed" }) {
  const supabase = await getSupabaseAdmin()
  let query = supabase
    .from("booking_details")
    .select(
      "id, booking_code, customer_name, phone, schedule_date, departure_time, destination, whatsapp_sent, whatsapp_attempts, whatsapp_last_error, created_at",
    )
    .eq("whatsapp_sent", false)
    .order("created_at", { ascending: false })
    .limit(400)

  if (filter?.mode === "pending") {
    query = query.eq("whatsapp_attempts", 0)
  } else if (filter?.mode === "failed") {
    query = query.gt("whatsapp_attempts", 0)
  }

  const { data, error } = await query
  if (error) {
    await logAdminAction("FETCH_SEND_QUEUE_FAIL", { error: error.message })
    throw new Error(error.message)
  }

  await logAdminAction("FETCH_SEND_QUEUE", { count: data?.length ?? 0, mode: filter?.mode ?? "all" })
  return data ?? []
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

  const limit = filters.limit ? Number(filters.limit) : 200
  query = query.limit(limit)

  const { data } = await query
  return data ?? []
}

export async function fetchSchedulesAction(filters: Record<string, any>) {
  const supabase = await getSupabaseAdmin()
  let query = supabase
    .from("daily_schedules")
    .select(`id, schedule_date, current_booked, status, bus_schedules ( id, departure_time, destination, max_capacity, hotel_id, hotels ( id, name ) )`)
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

export async function cancelSchedule(scheduleId: string) {
  const supabase = await getSupabaseAdmin()
  const { data: schedule } = await supabase
    .from("daily_schedules")
    .select("id, schedule_date, status")
    .eq("id", scheduleId)
    .single()

  if (!schedule) return { ok: false, error: "Schedule tidak ditemukan" }

  const today = new Date()
  const scheduleDate = new Date(schedule.schedule_date)
  if (scheduleDate < new Date(today.toDateString())) {
    return { ok: false, error: "Tidak bisa membatalkan jadwal yang sudah lewat" }
  }

  const { error } = await supabase
    .from("daily_schedules")
    .update({ status: "cancelled" })
    .eq("id", scheduleId)

  await logAdminAction("CANCEL_SCHEDULE", { schedule_id: scheduleId, ok: !error })
  if (error) return { ok: false, error: error.message }
  revalidatePath("/admin/schedules")
  return { ok: true }
}

export async function exportPassengersCsv(scheduleId: string) {
  const supabase = await getSupabaseAdmin()
  const { data } = await supabase
    .from("booking_details")
    .select("booking_code, customer_name, phone, passenger_count, room_number, schedule_date, departure_time")
    .eq("daily_schedule_id", scheduleId)

  const rows = data ?? []
  const header = ["booking_code","customer_name","phone","passenger_count","room_number","schedule_date","departure_time"]
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
