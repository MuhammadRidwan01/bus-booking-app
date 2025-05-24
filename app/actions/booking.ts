"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { bookingSchema } from "@/lib/validations"
import { generateBookingCode, formatPhoneNumber } from "@/lib/utils"
import { redirect } from "next/navigation"

export async function createBooking(formData: FormData) {
  if (!formData) {
    throw new Error("formData is null");
  }

  const customerName = formData.get("customerName")
  if (!customerName) {
    throw new Error("Nama lengkap harus diisi");
  }
  try {
    // Validate form data
    const rawData = {
      customerName: formData.get("customerName") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      bookingDate: formData.get("bookingDate") as string,
      scheduleId: formData.get("scheduleId") as string,
      passengerCount: Number.parseInt(formData.get("passengerCount") as string),
    }

    const validatedData = bookingSchema.parse(rawData)

    // Get hotel ID from schedule
    const { data: schedule } = await supabaseAdmin
      .from("daily_schedules")
      .select(`
        id,
        current_booked,
        bus_schedules (
          hotel_id,
          max_capacity
        )
      `)
      .eq("id", validatedData.scheduleId)
      .single()

    if (!schedule) {
      throw new Error("Jadwal tidak ditemukan")
    }

    // Check capacity
    if (schedule.current_booked + validatedData.passengerCount > schedule.bus_schedules.max_capacity) {
      throw new Error("Kapasitas tidak mencukupi")
    }

    // Generate booking code
    const bookingCode = generateBookingCode()

    // Create booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        booking_code: bookingCode,
        hotel_id: schedule.bus_schedules.hotel_id,
        daily_schedule_id: validatedData.scheduleId,
        customer_name: validatedData.customerName,
        phone: formatPhoneNumber(validatedData.phoneNumber),
        passenger_count: validatedData.passengerCount,
        status: "confirmed",
      })
      .select()
      .single()

    if (bookingError) {
      throw new Error("Gagal membuat booking")
    }

    // Update capacity
    const { error: capacityError } = await supabaseAdmin.rpc("increment_capacity", {
      schedule_id: validatedData.scheduleId,
      increment: validatedData.passengerCount,
    })

    if (capacityError) {
      console.error("Failed to update capacity:", capacityError)
    }

    // TODO: Send WhatsApp ticket
    // await sendTicketToWhatsApp(booking)
    redirect(`/booking/confirmation?code=${bookingCode}`)
  } catch (error) {
    console.error("Booking error:", error)
    throw error
  }

  
}

export async function getBookingByCode(code: string) {
  try {
    const { data: booking } = await supabaseAdmin.from("booking_details").select("*").eq("booking_code", code).single()

    return { found: !!booking, booking }
  } catch (error) {
    return { found: false, booking: null }
  }
}
