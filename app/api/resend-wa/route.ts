import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { sendWhatsappMessage } from "@/lib/whatsapp"
import { formatDate, formatTime } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const code = typeof body?.code === "string" ? body.code : null

    if (!code) {
      return NextResponse.json({ ok: false, error: "Booking code is required" }, { status: 400 })
    }

    const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "") || ""
    if (!baseUrl) {
      return NextResponse.json({ ok: false, error: "APP_BASE_URL not configured" }, { status: 500 })
    }

    const supabase = await getSupabaseAdmin()
    const { data: booking } = await supabase
      .from("booking_details")
      .select(
        "id, booking_code, customer_name, phone, hotel_name, schedule_date, departure_time, destination, whatsapp_attempts"
      )
      .eq("booking_code", code)
      .maybeSingle()

    if (!booking) {
      return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 })
    }

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

    const whatsappMessage = messageParts.join("\n")

    const waResult = await sendWhatsappMessage({
      phone: booking.phone,
      message: whatsappMessage,
      pdfUrl: pdfLink,
      caption: `Tiket Shuttle - ${booking.booking_code}`,
    })

    const waErrorMessage = waResult.ok ? null : (waResult.data as any)?.error ?? "Wablas send failed"

    const { error: logError } = await supabase
      .from("bookings")
      .update({
        whatsapp_attempts: (booking as any)?.whatsapp_attempts ? Number((booking as any).whatsapp_attempts) + 1 : 1,
        whatsapp_sent: waResult.ok,
        whatsapp_last_error: waErrorMessage,
      })
      .eq("id", booking.id)

    if (logError) {
      console.error("Failed to log resend WhatsApp:", logError)
    }

    return NextResponse.json({ ok: waResult.ok, error: waResult.ok ? null : waErrorMessage })
  } catch (error) {
    console.error("resend-wa error", error)
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 })
  }
}
