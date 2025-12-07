import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { getAdminSession } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  const adminSecret = process.env.ADMIN_SECRET
  const url = new URL(req.url)
  const key = url.searchParams.get("key") || req.cookies.get("admin_key")?.value
  if (!session && adminSecret && key !== adminSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const dailyScheduleId = searchParams.get("dailyScheduleId")

  if (!dailyScheduleId) {
    return NextResponse.json({ ok: false, error: "dailyScheduleId required" }, { status: 400 })
  }

  const supabase = await getSupabaseAdmin()
  const attemptView = await supabase
    .from("booking_details")
    .select("*")
    .eq("daily_schedule_id", dailyScheduleId)
    .order("created_at", { ascending: false })

  if (!attemptView.error) {
    return NextResponse.json({ ok: true, data: attemptView.data ?? [] })
  }

  // Fallback in case booking_details view is outdated
  if (attemptView.error?.code === "42703") {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `id, booking_code, hotel_id, daily_schedule_id, customer_name, phone, passenger_count, status, whatsapp_sent, whatsapp_attempts, whatsapp_last_error, room_number, created_at,
         daily_schedules ( schedule_date, bus_schedules ( departure_time, destination, hotels ( name ) ) )`
      )
      .eq("daily_schedule_id", dailyScheduleId)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const mapped =
      data?.map((row: any) => ({
        ...row,
        hotel_name: row.daily_schedules?.bus_schedules?.hotels?.name ?? "",
        departure_time: row.daily_schedules?.bus_schedules?.departure_time ?? "",
        destination: row.daily_schedules?.bus_schedules?.destination ?? "",
        schedule_date: row.daily_schedules?.schedule_date ?? "",
      })) ?? []

    return NextResponse.json({ ok: true, data: mapped })
  }

  return NextResponse.json({ ok: false, error: attemptView.error.message }, { status: 500 })
}
