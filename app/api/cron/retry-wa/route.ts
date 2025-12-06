import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { sendWhatsappMessage } from "@/lib/whatsapp"
import { normalizeTo62 } from "@/lib/phone"
import { formatDate, formatTime } from "@/lib/utils"

const MAX_ATTEMPTS = 3
const BATCH_LIMIT = 25

type QueueRow = {
  id: string
  booking_code: string
  customer_name: string
  phone: string
  schedule_date?: string | null
  departure_time?: string | null
  destination?: string | null
  whatsapp_sent: boolean
  whatsapp_attempts?: number | null
  whatsapp_last_error?: string | null
  hotel_name?: string | null
  has_whatsapp?: boolean | null
}

function unauthorized() {
  return new NextResponse("Unauthorized", { status: 401 })
}

async function fetchQueue(supabase: any): Promise<QueueRow[]> {
  const attempt = await supabase
    .from("booking_details")
    .select(
      "id, booking_code, customer_name, phone, schedule_date, departure_time, destination, whatsapp_sent, whatsapp_attempts, whatsapp_last_error, hotel_name, has_whatsapp",
    )
    .eq("whatsapp_sent", false)
    .lt("whatsapp_attempts", MAX_ATTEMPTS)
    .order("whatsapp_attempts", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(BATCH_LIMIT)

  if (attempt.error?.code === "42703") {
    const fb = await supabase
      .from("bookings")
      .select(
        `id, booking_code, customer_name, phone, status, whatsapp_sent, whatsapp_attempts, whatsapp_last_error, created_at, has_whatsapp,
         daily_schedules ( schedule_date, bus_schedules ( departure_time, destination, hotels ( name ) ) )`,
      )
      .eq("whatsapp_sent", false)
      .lt("whatsapp_attempts", MAX_ATTEMPTS)
      .order("whatsapp_attempts", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(BATCH_LIMIT)

    if (fb.error) throw fb.error

    return (fb.data ?? []).map((row: any) => ({
      id: row.id,
      booking_code: row.booking_code,
      customer_name: row.customer_name,
      phone: row.phone,
      schedule_date: row.daily_schedules?.schedule_date ?? null,
      departure_time: row.daily_schedules?.bus_schedules?.departure_time ?? null,
      destination: row.daily_schedules?.bus_schedules?.destination ?? null,
      hotel_name: row.daily_schedules?.bus_schedules?.hotels?.name ?? null,
      whatsapp_sent: row.whatsapp_sent,
      whatsapp_attempts: row.whatsapp_attempts,
      whatsapp_last_error: row.whatsapp_last_error,
      has_whatsapp: row.has_whatsapp,
    }))
  }

  if (attempt.error) throw attempt.error
  return attempt.data ?? []
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return unauthorized()
  }

  const supabase = await getSupabaseAdmin()
  const baseUrl = (process.env.APP_BASE_URL || "").replace(/\/$/, "")

  try {
    const queue = await fetchQueue(supabase)
    const results: Array<{ id: string; code: string; ok: boolean; error?: string | null }> = []

    for (const item of queue) {
      if (item.has_whatsapp === false) {
        // Skip numbers marked as non-WA; still bump attempt to avoid endless retries
        const nextAttempts = (item.whatsapp_attempts ?? 0) + 1
        await supabase
          .from("bookings")
          .update({
            whatsapp_attempts: nextAttempts,
            whatsapp_sent: false,
            whatsapp_last_error: "User indicated number is not on WhatsApp",
          })
          .eq("id", item.id)
        results.push({ id: item.id, code: item.booking_code, ok: false, error: "has_whatsapp=false" })
        continue
      }

      const normalizedPhone = normalizeTo62(item.phone)
      const trackLink = `${baseUrl}/track?code=${item.booking_code}`
      const pdfLink = `${baseUrl}/api/ticket/${item.booking_code}`

      const messageParts = [
        `Halo ${item.customer_name}, booking shuttle kamu sudah berhasil.`,
        item.hotel_name ? `Hotel: ${item.hotel_name}` : null,
        item.schedule_date ? `Tanggal: ${formatDate(item.schedule_date)}` : null,
        item.departure_time ? `Jam: ${formatTime(item.departure_time)} WIB` : null,
        item.destination ? `Tujuan: ${item.destination}` : null,
        `Kode Booking: ${item.booking_code}`,
        `Lacak tiket: ${trackLink}`,
        "Terima kasih.",
      ].filter(Boolean)
      const message = messageParts.join("\n")

      const waResult = await sendWhatsappMessage({
        phone: normalizedPhone,
        message,
        pdfUrl: pdfLink,
        caption: `Tiket Shuttle - ${item.booking_code}`,
      })

      const waErrorMessage = waResult.ok ? null : (waResult.data as any)?.error ?? "Wablas send failed"
      const nextAttempts = (item.whatsapp_attempts ?? 0) + 1

      await supabase
        .from("bookings")
        .update({
          whatsapp_attempts: nextAttempts,
          whatsapp_sent: waResult.ok,
          whatsapp_last_error: waErrorMessage,
        })
        .eq("id", item.id)

      results.push({ id: item.id, code: item.booking_code, ok: waResult.ok, error: waErrorMessage })
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      success: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    })
  } catch (error: any) {
    console.error("retry-wa cron failed:", error)
    return NextResponse.json({ ok: false, error: error?.message ?? "Retry WA failed" }, { status: 500 })
  }
}
