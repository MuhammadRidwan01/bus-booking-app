import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { clientConfig } from "@/lib/supabase-config"
import { getSupabaseAdmin } from "@/lib/supabase-server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.json({ ok: false, error: "Booking code is required" }, { status: 400 })
  }

  try {
    // 1. Fetch current WhatsApp status from Edge Function (for real-time accuracy if needed)
    //    or rely on DB. Let's rely on DB for simplicity and speed, but maybe check edge for "latest" status if pending.
    //    Actually, to keep it fast, let's just query the DB directly.

    const supabaseAdmin = await getSupabaseAdmin()

    // Fetch full details
    const { data: booking, error } = await supabaseAdmin
      .from("booking_details")
      .select("*")
      .eq("booking_code", code)
      .single()

    if (error || !booking) {
      return NextResponse.json({ ok: false, error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      data: {
        whatsapp_sent: booking.whatsapp_sent,
        whatsapp_attempts: booking.whatsapp_attempts ?? 0,
        whatsapp_last_error: booking.whatsapp_last_error,
        // Detailed info for UI
        ...booking
      },
    })
  } catch (error) {
    console.error("booking-status error", error)
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 })
  }
}
