"use server"

import { getSupabaseAdmin } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"
import { clientConfig } from "@/lib/supabase-config"

// Validation schema
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

    // Call Edge Function with anon key (public booking)
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/booking`
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      },
      body: JSON.stringify(validatedData)
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Gagal membuat booking')
    }

    // Redirect ke halaman konfirmasi
    redirect(`/booking/confirmation?code=${result.data.bookingCode}`)
  } catch (error) {
    console.error("Booking error:", error)
    throw error
  }
}

/**
 * Get booking by code - now proxies to Edge Function
 */
export async function getBookingByCode(code: string) {
  try {
    // Call Edge Function with anon key (public access)
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/booking-status?code=${encodeURIComponent(code)}`
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      }
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      return { found: false, booking: null }
    }

    return {
      found: result.found,
      booking: result.booking
    }
  } catch (error) {
    console.error("Error getting booking by code:", error)
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
