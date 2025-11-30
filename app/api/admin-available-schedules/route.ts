import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET
  if (adminSecret) {
    const url = new URL(req.url)
    const key = url.searchParams.get("key") || req.cookies.get("admin_key")?.value
    if (key !== adminSecret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }
  }

  const { searchParams } = new URL(req.url)
  const hotelId = searchParams.get("hotelId")
  const days = Number(searchParams.get("days") ?? "14")

  if (!hotelId) {
    return NextResponse.json({ ok: false, error: "hotelId required" }, { status: 400 })
  }

  const supabase = await getSupabaseAdmin()
  const { data, error } = await supabase
    .from("available_schedules")
    .select("daily_schedule_id, hotel_id, hotel_name, schedule_date, departure_time, destination, available_seats, status")
    .eq("hotel_id", hotelId)
    .gte("schedule_date", new Date().toISOString().slice(0, 10))
    .lte("schedule_date", new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    .order("schedule_date", { ascending: true })
    .order("departure_time", { ascending: true })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: data ?? [] })
}
