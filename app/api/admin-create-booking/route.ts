import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { getAdminSession } from "@/lib/admin-auth"
import { generateBookingCode, formatDate, formatTime } from "@/lib/utils"
import { normalizeTo62 } from "@/lib/phone"
import { sendWhatsappMessage } from "@/lib/whatsapp"

const bodySchema = z.object({
  hotelId: z.string().uuid(),
  dailyScheduleId: z.string().uuid(),
  customerName: z.string().min(1),
  phoneNumber: z.string().min(5),
  passengerCount: z.number().int().positive().max(5),
  roomNumber: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  const adminSecret = process.env.ADMIN_SECRET
  const url = new URL(req.url)
  const key = url.searchParams.get("key") || req.cookies.get("admin_key")?.value
  if (!session && adminSecret && key !== adminSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  let parsedBody: z.infer<typeof bodySchema>
  try {
    const json = await req.json()
    parsedBody = bodySchema.parse(json)
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 })
  }

  const supabase = await getSupabaseAdmin()

  const { data: schedule } = await supabase
    .from("daily_schedules")
    .select(
      `id, schedule_date, current_booked, status,
       bus_schedules ( id, hotel_id, departure_time, destination, max_capacity )`
    )
    .eq("id", parsedBody.dailyScheduleId)
    .single()

  if (!schedule) {
    return NextResponse.json({ ok: false, error: "Schedule not found" }, { status: 404 })
  }

  const busSchedule = Array.isArray(schedule.bus_schedules) ? schedule.bus_schedules[0] : schedule.bus_schedules
  if (!busSchedule || busSchedule.hotel_id !== parsedBody.hotelId) {
    return NextResponse.json({ ok: false, error: "Schedule does not match hotel" }, { status: 400 })
  }

  if (schedule.status === "cancelled" || schedule.status === "expired") {
    return NextResponse.json({ ok: false, error: "Schedule is not active" }, { status: 400 })
  }

  const maxCap = busSchedule.max_capacity ?? 0
  if (schedule.current_booked + parsedBody.passengerCount > maxCap) {
    return NextResponse.json({ ok: false, error: "Insufficient capacity" }, { status: 400 })
  }

  const bookingCode = generateBookingCode()
  const normalizedPhone = normalizeTo62(parsedBody.phoneNumber)
  const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "") || ""
  const trackLink = `${baseUrl}/track?code=${bookingCode}`
  const pdfLink = `${baseUrl}/api/ticket/${bookingCode}`

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      booking_code: bookingCode,
      hotel_id: parsedBody.hotelId,
      daily_schedule_id: parsedBody.dailyScheduleId,
      customer_name: parsedBody.customerName,
      phone: normalizedPhone,
      passenger_count: parsedBody.passengerCount,
      status: "confirmed",
      room_number: parsedBody.roomNumber,
    })
    .select()
    .single()

  if (bookingError) {
    return NextResponse.json({ ok: false, error: bookingError.message }, { status: 500 })
  }

  await supabase.rpc("increment_capacity", {
    schedule_id: parsedBody.dailyScheduleId,
    increment: parsedBody.passengerCount,
  })

  const messageParts = [
    `Hi ${parsedBody.customerName}, your shuttle booking is confirmed.`,
    busSchedule.destination ? `Destination: ${busSchedule.destination}` : null,
    `Date: ${formatDate(schedule.schedule_date)}`,
    busSchedule.departure_time ? `Time: ${formatTime(busSchedule.departure_time)} WIB` : null,
    `Booking code: ${bookingCode}`,
    `Track your ticket: ${trackLink}`,
    "Thank you.",
  ].filter(Boolean)

  // Send WhatsApp in background to avoid blocking admin UI
  ;(async () => {
    try {
      const waResult = await sendWhatsappMessage({
        phone: normalizedPhone,
        message: messageParts.join("\n"),
        pdfUrl: pdfLink,
        caption: `Shuttle Ticket - ${bookingCode}`,
      })
      const waErrorMessage = waResult.ok ? null : (waResult.data as any)?.error ?? "Wablas send failed"

      await supabase
        .from("bookings")
        .update({
          whatsapp_attempts: (booking as any).whatsapp_attempts ? Number((booking as any).whatsapp_attempts) + 1 : 1,
          whatsapp_sent: waResult.ok,
          whatsapp_last_error: waResult.ok ? null : waErrorMessage,
        })
        .eq("id", booking.id)
    } catch (error) {
      await supabase
        .from("bookings")
        .update({
          whatsapp_attempts: (booking as any).whatsapp_attempts ? Number((booking as any).whatsapp_attempts) + 1 : 1,
          whatsapp_sent: false,
          whatsapp_last_error: error instanceof Error ? error.message : "WhatsApp send failed",
        })
        .eq("id", booking.id)
    }
  })()

  return NextResponse.json({ ok: true, data: booking, whatsappSent: true })
}
