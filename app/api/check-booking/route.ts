import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const idempotencyKey = searchParams.get("idempotency_key")

    if (!idempotencyKey) {
      return NextResponse.json(
        { ok: false, error: "Missing idempotency_key" },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseAdmin()

    // Check if booking exists with this idempotency key
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("booking_code")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle()

    if (error) {
      console.error("Error checking booking:", error)
      return NextResponse.json(
        { ok: false, error: "Database error" },
        { status: 500 }
      )
    }

    if (booking) {
      return NextResponse.json({
        ok: true,
        found: true,
        bookingCode: booking.booking_code,
      })
    }

    return NextResponse.json({
      ok: true,
      found: false,
      bookingCode: null,
    })
  } catch (error) {
    console.error("Error in check-booking:", error)
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
