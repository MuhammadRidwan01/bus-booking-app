import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { getAdminSession } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId, acknowledgedBy = "driver" } = body

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    const supabase = await getSupabaseAdmin()
    
    // Acknowledge the notification
    const { error } = await supabase
      .rpc('acknowledge_driver_notification', {
        p_notification_id: notificationId,
        p_acknowledged_by: acknowledgedBy
      })

    if (error) {
      console.error("Error acknowledging driver notification:", error)
      return NextResponse.json({ error: "Failed to acknowledge notification" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error("Driver notification acknowledgment API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, acknowledgedBy = "driver" } = body

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    const supabase = await getSupabaseAdmin()
    
    // Acknowledge all notifications for a booking
    const { error } = await supabase
      .from('driver_notifications')
      .update({
        is_acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: acknowledgedBy
      })
      .eq('booking_id', bookingId)
      .eq('is_acknowledged', false)

    if (error) {
      console.error("Error acknowledging booking notifications:", error)
      return NextResponse.json({ error: "Failed to acknowledge notifications" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error("Booking notification acknowledgment API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}