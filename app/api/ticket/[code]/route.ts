import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { generateTicketPdf } from "@/lib/ticket"
import { formatDate, formatTime } from "@/lib/utils"

export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await ctx.params

    // Validate booking code format
    if (!code || code.trim().length === 0) {
      console.error('[Ticket API] Invalid booking code: empty or missing')
      return NextResponse.json(
        { ok: false, error: "Kode booking tidak valid" },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseAdmin()
    const { data: booking, error: dbError } = await supabase
      .from("booking_details")
      .select("*")
      .eq("booking_code", code)
      .single()

    if (dbError) {
      console.error('[Ticket API] Database error fetching booking:', {
        code,
        error: dbError.message,
      })
      return NextResponse.json(
        { ok: false, error: "Terjadi kesalahan saat mengambil data booking" },
        { status: 500 }
      )
    }

    if (!booking) {
      console.warn('[Ticket API] Booking not found:', code)
      return NextResponse.json(
        { ok: false, error: "Booking tidak ditemukan" },
        { status: 404 }
      )
    }

    // Validate required booking data
    if (!booking.customer_name || !booking.booking_code) {
      console.error('[Ticket API] Missing required booking data:', {
        code,
        hasCustomerName: !!booking.customer_name,
        hasBookingCode: !!booking.booking_code,
      })
      return NextResponse.json(
        { ok: false, error: "Data booking tidak lengkap" },
        { status: 500 }
      )
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
      flightNumber: (booking as any).flight_number,
      trackUrl,
      serviceType: (booking as any).service_type,
      terminalCode: (booking as any).terminal_code,
      meetingPointLocation: (booking as any).meeting_point_location,
      arrivalTimeOffsetMin: (booking as any).arrival_time_offset_min,
      arrivalTimeOffsetMax: (booking as any).arrival_time_offset_max,
      // Pass the new fields
      phone: booking.phone,
      roomNumber: (booking as any).room_number,
      hasSurfboard: (booking as any).has_surfboard,
      surfboardCount: (booking as any).surfboard_count,
      excessBaggageCount: (booking as any).excess_baggage_count,
      // Hotel contact mapping
      ...((booking.hotel_name?.toLowerCase().includes('budget') || (booking as any).hotel_slug === 'ibis-budget') ? {
        hotelWhatsApp: "+62 21 2933 7888",
        hotelFax: "+62 21 2923 7637",
        hotelEmail: "H8593-RE@ACCOR.COM"
      } : {
        hotelWhatsApp: "+62 21 2932 7777",
        hotelFax: "+62 21 2923 7637",
        hotelEmail: "H8593-RE@ACCOR.COM"
      })
    })

    const buffer = Buffer.from(pdfBytes)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="shuttle-ticket-${code}.pdf"`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    // Catch any unexpected errors during PDF generation
    console.error('[Ticket API] PDF generation failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      { ok: false, error: "Gagal membuat tiket PDF. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
