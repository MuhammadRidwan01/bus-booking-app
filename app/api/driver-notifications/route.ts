import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { getAdminSession } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") || new Date().toISOString().split('T')[0]
    const endDate = searchParams.get("endDate") || new Date().toISOString().split('T')[0]

    const supabase = await getSupabaseAdmin()
    
    // Get unacknowledged notifications
    const { data: notifications, error } = await supabase
      .rpc('get_unacknowledged_driver_notifications', {
        p_start_date: startDate,
        p_end_date: endDate
      })

    if (error) {
      console.error("Error fetching driver notifications:", error)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    return NextResponse.json({ 
      ok: true, 
      data: notifications || [],
      count: notifications?.length || 0
    })

  } catch (error) {
    console.error("Driver notifications API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    const supabase = await getSupabaseAdmin()
    
    // Create notifications for the booking
    const { error } = await supabase
      .rpc('create_driver_notifications_for_booking', {
        p_booking_id: bookingId
      })

    if (error) {
      console.error("Error creating driver notifications:", error)
      return NextResponse.json({ error: "Failed to create notifications" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error("Driver notifications creation API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}