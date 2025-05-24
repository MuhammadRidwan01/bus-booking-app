import { z } from "zod"

export const bookingSchema = z.object({
  customerName: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  phoneNumber: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,9}$/, "Format nomor HP tidak valid"),
  bookingDate: z.string(),
  scheduleId: z.string().uuid("Schedule ID tidak valid"),
  passengerCount: z.number().min(1, "Minimal 1 penumpang").max(5, "Maksimal 5 penumpang"),
})

export const trackingSchema = z.object({
  bookingCode: z.string().min(1, "Kode booking harus diisi"),
})
