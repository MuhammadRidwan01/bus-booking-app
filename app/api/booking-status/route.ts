import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.json({ ok: false, error: "Booking code is required" }, { status: 400 })
  }

  try {
    const supabase = await getSupabaseAdmin()
    const { data: booking, error } = await supabase
      .from("booking_details")
      .select("id, booking_code, whatsapp_sent, whatsapp_attempts, whatsapp_last_error")
      .eq("booking_code", code)
      .maybeSingle()

    if (error && error.code === "42703") {
      const { data } = await supabase
        .from("bookings")
        .select("id, booking_code, whatsapp_sent, whatsapp_attempts, whatsapp_last_error")
        .eq("booking_code", code)
        .maybeSingle()
      if (!data) {
        return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 })
      }
      return NextResponse.json({
        ok: true,
        data: {
          whatsapp_sent: data.whatsapp_sent,
          whatsapp_attempts: (data as any)?.whatsapp_attempts ?? 0,
          whatsapp_last_error: (data as any)?.whatsapp_last_error,
        },
      })
    }

    if (!booking) {
      return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      data: {
        whatsapp_sent: booking.whatsapp_sent,
        whatsapp_attempts: booking.whatsapp_attempts ?? 0,
        whatsapp_last_error: booking.whatsapp_last_error,
      },
    })
  } catch (error) {
    console.error("booking-status error", error)
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 })
  }
}
