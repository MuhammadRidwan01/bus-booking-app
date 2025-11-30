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
  const dailyScheduleId = searchParams.get("dailyScheduleId")

  if (!dailyScheduleId) {
    return NextResponse.json({ ok: false, error: "dailyScheduleId required" }, { status: 400 })
  }

  const supabase = await getSupabaseAdmin()
  const { data, error } = await supabase
    .from("booking_details")
    .select("*")
    .eq("daily_schedule_id", dailyScheduleId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: data ?? [] })
}
