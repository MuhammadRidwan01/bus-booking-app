"use server"

import { getSupabaseAdmin } from "@/lib/supabase-server"
import { generateBookingCode, formatDate, formatTime } from "@/lib/utils"
import { redirect } from "next/navigation"
import { z } from "zod"
import { sendWhatsappMessage } from "@/lib/whatsapp"

// Validation schema - langsung di file ini
const bookingSchema = z.object({
  customerName: z.string().min(1, "Nama lengkap harus diisi"),
  phoneNumber: z.string().min(5, "Nomor WhatsApp tidak valid"),
  bookingDate: z.string().min(1, "Tanggal booking harus dipilih"),
  scheduleId: z.string().uuid("Schedule ID tidak valid"),
  passengerCount: z.number().min(1).max(5, "Jumlah penumpang maksimal 5 orang"),
  roomNumber: z.string().min(1, "Nomor kamar harus diisi"),
  idempotencyKey: z.string().min(8, "Idempotency key tidak valid"),
  hasWhatsapp: z.enum(["yes", "no"]).default("yes"),
  countryCode: z.string().min(1, "Kode negara harus diisi"),
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
      idempotencyKey: formData.get("idempotencyKey") as string,
      hasWhatsapp: ((formData.get("hasWhatsapp") as string) || "yes") as "yes" | "no",
      countryCode: (formData.get("countryCode") as string) || "62",
    }

    const validatedData = bookingSchema.parse(rawData)

    // Short-circuit if this request has already produced a booking
    let idempotencySupported = true
    let existingBooking = null as { id: string; booking_code: string } | null
    try {
      const existing = await supabaseAdmin
        .from("bookings")
        .select("id, booking_code")
        .eq("idempotency_key", validatedData.idempotencyKey)
        .maybeSingle()
      existingBooking = existing.data
    } catch (existingError: any) {
      // Column might not exist if migration belum jalan; fallback tanpa idempotency
      if (existingError?.code === "42703") {
        idempotencySupported = false
      } else if (existingError?.code !== "PGRST116") {
        console.error("Check existing booking by idempotency error:", existingError)
        throw new Error("Gagal memproses booking, coba lagi")
      }
    }

    if (existingBooking) {
      redirect(`/booking/confirmation?code=${existingBooking.booking_code}`)
    }

    // Ambil informasi jadwal & kapasitas
    const { data: schedule } = await supabaseAdmin
      .from("daily_schedules")
      .select(`
        id,
        schedule_date,
        current_booked,
        bus_schedule_id,
        bus_schedules (
          hotel_id,
          max_capacity,
          departure_time,
          destination
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

    const normalizedPhone = normalizePhoneWithCountry(validatedData.phoneNumber, validatedData.countryCode)
    const hotel = busSchedule?.hotel_id ? await getHotelDetails(busSchedule.hotel_id) : null
    const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "") || ""
    const trackLink = `${baseUrl}/track?code=${bookingCode}`
    const pdfLink = `${baseUrl}/api/ticket/${bookingCode}`

    const messageParts = [
      `Halo ${validatedData.customerName}, booking shuttle kamu sudah berhasil.`,
      `Hotel: ${hotel?.name ?? "Ibis Hotel"}`,
      `Tanggal: ${formatDate(validatedData.bookingDate)}`,
      busSchedule?.departure_time ? `Jam: ${formatTime(busSchedule.departure_time)} WIB` : null,
      busSchedule?.destination ? `Tujuan: ${busSchedule.destination}` : null,
      `Kode Booking: ${bookingCode}`,
      `Lacak tiket: ${trackLink}`,
      "Terima kasih.",
    ].filter(Boolean)
    const whatsappMessage = messageParts.join("\n")

    // Simpan booking ke database
    const insertPayload: Record<string, any> = {
      booking_code: bookingCode,
      hotel_id: busSchedule?.hotel_id,
      daily_schedule_id: validatedData.scheduleId,
      customer_name: validatedData.customerName,
      phone: normalizedPhone,
      passenger_count: validatedData.passengerCount,
      status: "confirmed",
      room_number: validatedData.roomNumber,
    }

    if (idempotencySupported) {
      insertPayload.idempotency_key = validatedData.idempotencyKey
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert(insertPayload)
      .select()
      .single()

    if (bookingError) {
      if (bookingError.code === "23505" && idempotencySupported) {
        const { data: dupBooking, error: fetchDupError } = await supabaseAdmin
          .from("bookings")
          .select("id, booking_code")
          .eq("idempotency_key", validatedData.idempotencyKey)
          .maybeSingle()

        if (fetchDupError && fetchDupError.code !== "PGRST116") {
          console.error("Failed to fetch duplicate booking after conflict:", fetchDupError)
        }

        if (dupBooking) {
          redirect(`/booking/confirmation?code=${dupBooking.booking_code}`)
        }
      }

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

    // Kirim WhatsApp di background jika user menyatakan nomor WA aktif
    const attemptCount = (booking as any)?.whatsapp_attempts ? Number((booking as any).whatsapp_attempts) : 0
    const userHasWhatsapp = validatedData.hasWhatsapp !== "no"

    if (!userHasWhatsapp) {
      const { error: whatsappLogError } = await supabaseAdmin
        .from("bookings")
        .update({
          whatsapp_attempts: attemptCount,
          whatsapp_sent: false,
          whatsapp_last_error: "User indicated number is not on WhatsApp",
        })
        .eq("id", booking.id)

      if (whatsappLogError) {
        console.error("Gagal update log WhatsApp (no WA):", whatsappLogError)
      }
    } else {
      const sendWhatsappInBackground = async () => {
        try {
          const waResult = await sendWhatsappMessage({
            phone: normalizedPhone,
            message: whatsappMessage,
            pdfUrl: pdfLink,
            caption: `Tiket Shuttle - ${bookingCode}`,
          })

          const waErrorMessage = waResult.ok
            ? null
            : (waResult.data as any)?.error ?? "Wablas send failed"
          if (!waResult.ok && waResult.data && (waResult.data as any).pdfUrl) {
            console.error("PDF not sent, link fallback", (waResult.data as any).pdfUrl)
          }

          const { error: whatsappLogError } = await supabaseAdmin
            .from("bookings")
            .update({
              whatsapp_attempts: attemptCount + 1,
              whatsapp_sent: waResult.ok,
              whatsapp_last_error: waResult.ok ? null : waErrorMessage,
            })
            .eq("id", booking.id)

          if (whatsappLogError) {
            console.error("Gagal update log WhatsApp:", whatsappLogError)
          }
        } catch (waError) {
          console.error("Gagal kirim atau log WhatsApp:", waError instanceof Error ? waError.message : waError)

          const { error: whatsappLogError } = await supabaseAdmin
            .from("bookings")
            .update({
              whatsapp_attempts: attemptCount + 1,
              whatsapp_sent: false,
              whatsapp_last_error: waError instanceof Error ? waError.message : "Network/timeout to Wablas",
            })
            .eq("id", booking.id)

          if (whatsappLogError) {
            console.error("Gagal update log WhatsApp setelah error kirim:", whatsappLogError)
          }
        }
      }

      void sendWhatsappInBackground()
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
    const { data: booking, error } = await supabaseAdmin
      .from("booking_details")
      .select("*")
      .eq("booking_code", code)
      .single()

    if (!error) {
      return { found: !!booking, booking }
    }

    // Fallback if view is outdated
    const { data } = await supabaseAdmin
      .from("bookings")
      .select(
        `id, booking_code, hotel_id, daily_schedule_id, customer_name, phone, passenger_count, status, whatsapp_sent, whatsapp_attempts, whatsapp_last_error, room_number, has_whatsapp, created_at,
         daily_schedules ( schedule_date, bus_schedules ( departure_time, destination, hotels ( name, slug ) ) )`
      )
      .eq("booking_code", code)
      .single()

    if (!data) return { found: false, booking: null }

    const mapped: any = {
      ...data,
      hotel_name: data.daily_schedules?.bus_schedules?.hotels?.name ?? "",
      hotel_slug: data.daily_schedules?.bus_schedules?.hotels?.slug ?? "",
      departure_time: data.daily_schedules?.bus_schedules?.departure_time ?? "",
      destination: data.daily_schedules?.bus_schedules?.destination ?? "",
      schedule_date: data.daily_schedules?.schedule_date ?? "",
    }

    return { found: true, booking: mapped }
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

function normalizePhoneWithCountry(phone: string, countryCode: string) {
  const digits = phone.replace(/[^\d+]/g, "")
  if (digits.startsWith("+")) {
    return digits.slice(1)
  }

  const code = (countryCode || "").replace(/\D/g, "") || "62"
  const local = digits.replace(/\D/g, "")

  if (local.startsWith(code)) return local
  if (local.startsWith("0")) return code + local.slice(1)
  return code + local
}
