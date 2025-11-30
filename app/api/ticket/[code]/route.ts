import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { generateTicketPdf } from "@/lib/ticket"
import { formatDate, formatTime } from "@/lib/utils"

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = params.code
  const supabase = await getSupabaseAdmin()
  const { data: booking } = await supabase
    .from("booking_details")
    .select("*")
    .eq("booking_code", code)
    .single()

  if (!booking) {
    return NextResponse.json({ ok: false, error: "Booking tidak ditemukan" }, { status: 404 })
  }

  const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "") || ""
  const trackUrl = `${baseUrl}/track?code=${code}`

  const pdfBytes = await generateTicketPdf({
    bookingCode: booking.booking_code,
    customerName: booking.customer_name,
    hotelName: booking.hotel_name,
    scheduleDate: booking.schedule_date ? formatDate(booking.schedule_date) : undefined,
    departureTime: booking.departure_time ? formatTime(booking.departure_time) : undefined,
    destination: booking.destination,
    passengerCount: booking.passenger_count,
    roomNumber: (booking as any).room_number,
    trackUrl,
  })

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="ticket-${code}.pdf"`,
    },
  })
}
