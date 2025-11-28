"use server"

import { getSupabaseAdmin } from "@/lib/supabase-server"
import { generateBookingCode, formatPhoneNumber } from "@/lib/utils"
import { redirect } from "next/navigation"
import { sendWhatsappTemplate } from "@/lib/send-wa"
import { z } from "zod"

// Validation schema - langsung di file ini
const bookingSchema = z.object({
  customerName: z.string().min(1, "Nama lengkap harus diisi"),
  phoneNumber: z.string().min(10, "Nomor WhatsApp tidak valid"),
  bookingDate: z.string().min(1, "Tanggal booking harus dipilih"),
  scheduleId: z.string().uuid("Schedule ID tidak valid"),
  passengerCount: z.number().min(1).max(5, "Jumlah penumpang maksimal 5 orang"),
  roomNumber: z.string().min(1, "Nomor kamar harus diisi"),
})

export async function createBooking(formData: FormData) {
  if (!formData) {
    throw new Error("formData is null")
  }

  const customerName = formData.get("customerName")
  if (!customerName) {
    throw new Error("Nama lengkap harus diisi")
  }

  try {
    const supabaseAdmin = await getSupabaseAdmin()

    // Validasi data form
    const rawData = {
      customerName: formData.get("customerName") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      bookingDate: formData.get("bookingDate") as string,
      scheduleId: formData.get("scheduleId") as string,
      passengerCount: Number.parseInt(formData.get("passengerCount") as string),
      roomNumber: formData.get("roomNumber") as string,
    }

    const validatedData = bookingSchema.parse(rawData)

    // Ambil informasi jadwal & kapasitas
    const { data: schedule } = await supabaseAdmin
      .from("daily_schedules")
      .select(`
        id,
        current_booked,
        bus_schedule_id,
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

    const busSchedule = Array.isArray(schedule.bus_schedules)
      ? schedule.bus_schedules[0]
      : schedule.bus_schedules
    const maxCapacity = busSchedule?.max_capacity

    if (!maxCapacity || schedule.current_booked + validatedData.passengerCount > maxCapacity) {
      throw new Error("Kapasitas tidak mencukupi")
    }

    // Generate kode booking unik
    const bookingCode = generateBookingCode()

    // Simpan booking ke database
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        booking_code: bookingCode,
        hotel_id: busSchedule?.hotel_id,
        daily_schedule_id: validatedData.scheduleId,
        customer_name: validatedData.customerName,
        phone: formatPhoneNumber(validatedData.phoneNumber),
        passenger_count: validatedData.passengerCount,
        status: "confirmed",
        room_number: validatedData.roomNumber,
      })
      .select()
      .single()

    if (bookingError) {
      console.error("Booking error details:", bookingError)
      throw new Error("Gagal membuat booking: " + bookingError.message)
    }

    // Update kapasitas harian
    const { error: capacityError } = await supabaseAdmin.rpc("increment_capacity", {
      schedule_id: validatedData.scheduleId,
      increment: validatedData.passengerCount,
    })

    if (capacityError) {
      console.error("Failed to update capacity:", capacityError)
    }

    // Kirim WA pakai template message (via /api/send-wa)
    try {
      await sendWhatsappTemplate(
        formatPhoneNumber(validatedData.phoneNumber),
        {
          "1": validatedData.customerName,
          "2": bookingCode,
          "3": "Hotel Ibis Shuttle",
        }
      )

      // Jika berhasil kirim WA, update kolom whatsapp_sent jadi true
      const { error: whatsappError } = await supabaseAdmin
        .from("bookings")
        .update({ whatsapp_sent: true })
        .eq("id", booking.id)

      if (whatsappError) {
        console.error("Gagal update status WhatsApp:", whatsappError)
      }

    } catch (waError) {
      console.error("Gagal kirim WhatsApp:", waError)
    }

    // Redirect ke halaman konfirmasi
    redirect(`/booking/confirmation?code=${bookingCode}`)
  } catch (error) {
    console.error("Booking error:", error)
    throw error
  }
}

export async function getBookingByCode(code: string) {
  try {
    const supabaseAdmin = await getSupabaseAdmin()
    const { data: booking } = await supabaseAdmin
      .from("booking_details")
      .select("*")
      .eq("booking_code", code)
      .single()

    return { found: !!booking, booking }
  } catch (error) {
    return { found: false, booking: null }
  }
}

export async function getHotelDetails(hotelId: string) {
  try {
    const supabaseAdmin = await getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from("hotels")
      .select("*")
      .eq("id", hotelId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error getting hotel details:", error)
    throw error
  }
}