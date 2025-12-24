import { z } from "zod"

// Base booking schema with common fields
const baseBookingSchema = z.object({
  customerName: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  phoneNumber: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,9}$/, "Format nomor HP tidak valid"),
  bookingDate: z.string(),
  scheduleId: z.string().uuid("Schedule ID tidak valid"),
  passengerCount: z.number().min(1, "Minimal 1 penumpang").max(5, "Maksimal 5 penumpang"),
  serviceType: z.enum(["drop_off", "pick_up"], {
    required_error: "Jenis layanan harus dipilih",
    invalid_type_error: "Jenis layanan tidak valid"
  }),
  terminalCode: z.string().nullable().optional(),
  meetingPointId: z.string().nullable().optional().refine((val) => {
    if (!val || val === "") return true
    return z.string().uuid().safeParse(val).success
  }, {
    message: "Meeting point ID tidak valid"
  }),
  // Enhanced booking fields
  roomNumber: z.string().optional(),
  flightNumber: z.string().optional(),
  hasSurfboard: z.boolean().default(false),
  surfboardCount: z.number().min(0, "Jumlah surfboard tidak boleh negatif").max(10, "Maksimal 10 surfboard").default(0),
  hasExcessBaggage: z.boolean().default(false),
  excessBaggageCount: z.number().min(0, "Jumlah bagasi berlebih tidak boleh negatif").max(20, "Maksimal 20 bagasi berlebih").default(0), // Keep for backward compatibility
  surfboardCost: z.number().min(0, "Biaya surfboard tidak boleh negatif").default(0),
  baggageCost: z.number().min(0, "Biaya bagasi tidak boleh negatif").default(0),
  totalCost: z.number().min(0, "Total biaya tidak boleh negatif").default(0),
})

// Enhanced booking schema with conditional validation
export const bookingSchema = baseBookingSchema.superRefine((data, ctx) => {
  // Service-specific field validation
  if (data.serviceType === "drop_off") {
    // Drop-off requires room number, flight number should be empty
    if (!data.roomNumber || data.roomNumber.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nomor kamar harus diisi untuk layanan drop-off",
        path: ["roomNumber"]
      })
    } else if (!/^[A-Za-z0-9\-\s]{1,20}$/.test(data.roomNumber.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Format nomor kamar tidak valid (hanya huruf, angka, spasi, dan tanda hubung)",
        path: ["roomNumber"]
      })
    }
    
    // Flight number should not be provided for drop-off
    if (data.flightNumber && data.flightNumber.trim() !== "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nomor penerbangan tidak diperlukan untuk layanan drop-off",
        path: ["flightNumber"]
      })
    }
  } else if (data.serviceType === "pick_up") {
    // Pick-up requires flight number, room number should be empty
    if (!data.flightNumber || data.flightNumber.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nomor penerbangan harus diisi untuk layanan pick-up",
        path: ["flightNumber"]
      })
    } else if (!/^[A-Z]{2,3}[0-9]{1,4}[A-Z]?$/i.test(data.flightNumber.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Format nomor penerbangan tidak valid (contoh: GA123, QZ8501)",
        path: ["flightNumber"]
      })
    }
    
    // Room number should not be provided for pick-up
    if (data.roomNumber && data.roomNumber.trim() !== "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nomor kamar tidak diperlukan untuk layanan pick-up",
        path: ["roomNumber"]
      })
    }
  }

  // Surfboard validation
  if (data.hasSurfboard) {
    if (data.surfboardCount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Jumlah surfboard harus lebih dari 0 jika membawa surfboard",
        path: ["surfboardCount"]
      })
    }
  } else {
    if (data.surfboardCount > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Jumlah surfboard harus 0 jika tidak membawa surfboard",
        path: ["surfboardCount"]
      })
    }
  }

  // Excess baggage validation - simplified to boolean
  if (data.hasExcessBaggage && data.baggageCost <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Biaya bagasi harus lebih dari 0 jika memiliki bagasi berlebih",
      path: ["baggageCost"]
    })
  } else if (!data.hasExcessBaggage && data.baggageCost > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Biaya bagasi harus 0 jika tidak ada bagasi berlebih",
      path: ["baggageCost"]
    })
  }

  // Pricing validation - costs should be non-negative and reasonable
  if (data.surfboardCost < 0 || data.baggageCost < 0 || data.totalCost < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Biaya tidak boleh negatif",
      path: ["totalCost"]
    })
  }

  // Total cost should equal surfboard cost + baggage cost
  const expectedTotal = data.surfboardCost + data.baggageCost;
  if (Math.abs(data.totalCost - expectedTotal) > 0.01) { // Allow for small floating point differences
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Total biaya tidak sesuai dengan perhitungan (surfboard + bagasi)",
      path: ["totalCost"]
    })
  }

  // Surfboard cost validation - should be reasonable
  if (data.hasSurfboard && data.surfboardCount > 0) {
    const minExpectedSurfboardCost = data.surfboardCount * 50000; // Minimum IDR 50,000 per board
    const maxExpectedSurfboardCost = data.surfboardCount * 100000; // Maximum IDR 100,000 per board
    
    if (data.surfboardCost < minExpectedSurfboardCost || data.surfboardCost > maxExpectedSurfboardCost) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Biaya surfboard tidak wajar untuk ${data.surfboardCount} surfboard`,
        path: ["surfboardCost"]
      })
    }
  }

  // Baggage cost validation - should be reasonable
  if (data.hasExcessBaggage) {
    const minExpectedBaggageCost = 50000; // Minimum IDR 50,000
    const maxExpectedBaggageCost = 200000; // Maximum IDR 200,000
    
    if (data.baggageCost < minExpectedBaggageCost || data.baggageCost > maxExpectedBaggageCost) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Biaya bagasi berlebih tidak wajar",
        path: ["baggageCost"]
      })
    }
  } else if (data.baggageCost > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Biaya bagasi harus 0 jika tidak ada bagasi berlebih",
      path: ["baggageCost"]
    })
  }
})

// Refined schema for pick-up bookings that require terminal selection
export const pickupBookingSchema = baseBookingSchema.extend({
  terminalCode: z.string().min(1, "Terminal harus dipilih untuk layanan pick-up"),
  meetingPointId: z.string().uuid("Meeting point ID tidak valid"),
  serviceType: z.literal("pick_up"),
  flightNumber: z.string().min(1, "Nomor penerbangan harus diisi untuk layanan pick-up")
    .regex(/^[A-Z]{2,3}[0-9]{1,4}[A-Z]?$/i, "Format nomor penerbangan tidak valid (contoh: GA123, QZ8501)"),
}).superRefine((data, ctx) => {
  // Apply the same validation logic as the main booking schema
  if (data.roomNumber && data.roomNumber.trim() !== "") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Nomor kamar tidak diperlukan untuk layanan pick-up",
      path: ["roomNumber"]
    })
  }

  // Surfboard validation
  if (data.hasSurfboard && data.surfboardCount <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Jumlah surfboard harus lebih dari 0 jika membawa surfboard",
      path: ["surfboardCount"]
    })
  } else if (!data.hasSurfboard && data.surfboardCount > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Jumlah surfboard harus 0 jika tidak membawa surfboard",
      path: ["surfboardCount"]
    })
  }

  // Pricing validation
  const expectedTotal = data.surfboardCost + data.baggageCost;
  if (Math.abs(data.totalCost - expectedTotal) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Total biaya tidak sesuai dengan perhitungan (surfboard + bagasi)",
      path: ["totalCost"]
    })
  }
})

// Schema for drop-off bookings
export const dropoffBookingSchema = baseBookingSchema.extend({
  serviceType: z.literal("drop_off"),
  roomNumber: z.string().min(1, "Nomor kamar harus diisi untuk layanan drop-off")
    .regex(/^[A-Za-z0-9\-\s]{1,20}$/, "Format nomor kamar tidak valid (hanya huruf, angka, spasi, dan tanda hubung)"),
}).superRefine((data, ctx) => {
  // Apply the same validation logic as the main booking schema
  if (data.flightNumber && data.flightNumber.trim() !== "") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Nomor penerbangan tidak diperlukan untuk layanan drop-off",
      path: ["flightNumber"]
    })
  }

  // Surfboard validation
  if (data.hasSurfboard && data.surfboardCount <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Jumlah surfboard harus lebih dari 0 jika membawa surfboard",
      path: ["surfboardCount"]
    })
  } else if (!data.hasSurfboard && data.surfboardCount > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Jumlah surfboard harus 0 jika tidak membawa surfboard",
      path: ["surfboardCount"]
    })
  }

  // Pricing validation
  const expectedTotal = data.surfboardCost + data.baggageCost;
  if (Math.abs(data.totalCost - expectedTotal) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Total biaya tidak sesuai dengan perhitungan (surfboard + bagasi)",
      path: ["totalCost"]
    })
  }
})

// Schema for surfboard selection
export const surfboardSchema = z.object({
  hasSurfboard: z.boolean(),
  surfboardCount: z.number().min(0).max(10).default(0),
}).superRefine((data, ctx) => {
  if (data.hasSurfboard && data.surfboardCount <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Jumlah surfboard harus lebih dari 0 jika membawa surfboard",
      path: ["surfboardCount"]
    })
  }
  if (!data.hasSurfboard && data.surfboardCount > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Jumlah surfboard harus 0 jika tidak membawa surfboard",
      path: ["surfboardCount"]
    })
  }
})

// Schema for baggage selection - simplified to boolean
export const baggageSchema = z.object({
  passengerCount: z.number().min(1).max(5),
  hasExcessBaggage: z.boolean().default(false),
  terminalCode: z.string().optional(),
})

// Schema for pricing calculation - updated for boolean baggage
export const pricingSchema = z.object({
  surfboardCount: z.number().min(0).default(0),
  hasExcessBaggage: z.boolean().default(false),
  terminalCode: z.string().optional(),
  surfboardCost: z.number().min(0).default(0),
  baggageCost: z.number().min(0).default(0),
  totalCost: z.number().min(0).default(0),
}).superRefine((data, ctx) => {
  // Validate total cost calculation
  const expectedTotal = data.surfboardCost + data.baggageCost;
  if (Math.abs(data.totalCost - expectedTotal) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Total biaya tidak sesuai dengan perhitungan (surfboard + bagasi)",
      path: ["totalCost"]
    })
  }

  // Validate surfboard cost reasonableness
  if (data.surfboardCount > 0) {
    const minExpectedSurfboardCost = data.surfboardCount * 50000;
    const maxExpectedSurfboardCost = data.surfboardCount * 100000;
    
    if (data.surfboardCost < minExpectedSurfboardCost || data.surfboardCost > maxExpectedSurfboardCost) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Biaya surfboard tidak wajar untuk ${data.surfboardCount} surfboard`,
        path: ["surfboardCost"]
      })
    }
  } else if (data.surfboardCost > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Biaya surfboard harus 0 jika tidak ada surfboard",
      path: ["surfboardCost"]
    })
  }

  // Validate baggage cost reasonableness
  if (data.hasExcessBaggage) {
    const minExpectedBaggageCost = 50000;
    const maxExpectedBaggageCost = 200000;
    
    if (data.baggageCost < minExpectedBaggageCost || data.baggageCost > maxExpectedBaggageCost) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Biaya bagasi berlebih tidak wajar",
        path: ["baggageCost"]
      })
    }
  } else if (data.baggageCost > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Biaya bagasi harus 0 jika tidak ada bagasi berlebih",
      path: ["baggageCost"]
    })
  }
})

// Schema for pricing configuration (admin use)
export const pricingConfigSchema = z.object({
  surfboardCostPerBoard: z.number().min(0, "Biaya surfboard per papan tidak boleh negatif"),
  baggageFreeItemsPerPassenger: z.number().min(0, "Jumlah bagasi gratis tidak boleh negatif"),
  baggageTerminal3CurbsideCost: z.number().min(0, "Biaya bagasi Terminal 3 tidak boleh negatif"),
  baggageOtherTerminalsCost: z.number().min(0, "Biaya bagasi terminal lain tidak boleh negatif"),
  currency: z.string().length(3, "Kode mata uang harus 3 karakter").default("IDR"),
})

export const trackingSchema = z.object({
  bookingCode: z.string().min(1, "Kode booking harus diisi"),
})

// Helper function to validate advance booking (minimum 20 minutes prior)
export function validateAdvanceBooking(departureDateTime: Date): boolean {
  const now = new Date()
  const jakartaNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}))
  const twentyMinutesFromNow = new Date(jakartaNow.getTime() + 20 * 60 * 1000)
  
  return departureDateTime >= twentyMinutesFromNow
}

// Helper function to validate room number format
export function validateRoomNumber(roomNumber: string): boolean {
  if (!roomNumber || roomNumber.trim() === "") return false
  return /^[A-Za-z0-9\-\s]{1,20}$/.test(roomNumber.trim())
}

// Helper function to validate flight number format
export function validateFlightNumber(flightNumber: string): boolean {
  if (!flightNumber || flightNumber.trim() === "") return false
  return /^[A-Z]{2,3}[0-9]{1,4}[A-Z]?$/i.test(flightNumber.trim())
}

// Helper function to calculate surfboard cost
export function calculateSurfboardCost(surfboardCount: number, costPerBoard: number = 75000): number {
  if (surfboardCount <= 0) return 0
  return surfboardCount * costPerBoard
}

// Helper function to calculate baggage cost - updated for boolean
export function calculateBaggageCost(
  hasExcessBaggage: boolean, 
  terminalCode?: string,
  terminal3Cost: number = 150000,
  otherTerminalsCost: number = 75000
): number {
  if (!hasExcessBaggage) return 0
  
  const isTerminal3 = terminalCode === 'Terminal 3' || terminalCode === 'terminal3' || terminalCode === 'T3'
  return isTerminal3 ? terminal3Cost : otherTerminalsCost
}

// Helper function to calculate total booking cost
export function calculateTotalCost(surfboardCost: number, baggageCost: number): number {
  return surfboardCost + baggageCost
}

// Helper function to validate service-specific fields
export function validateServiceSpecificFields(
  serviceType: 'drop_off' | 'pick_up',
  roomNumber?: string,
  flightNumber?: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (serviceType === 'drop_off') {
    if (!roomNumber || roomNumber.trim() === '') {
      errors.push('Nomor kamar harus diisi untuk layanan drop-off')
    } else if (!validateRoomNumber(roomNumber)) {
      errors.push('Format nomor kamar tidak valid (hanya huruf, angka, spasi, dan tanda hubung)')
    }
    
    if (flightNumber && flightNumber.trim() !== '') {
      errors.push('Nomor penerbangan tidak diperlukan untuk layanan drop-off')
    }
  } else if (serviceType === 'pick_up') {
    if (!flightNumber || flightNumber.trim() === '') {
      errors.push('Nomor penerbangan harus diisi untuk layanan pick-up')
    } else if (!validateFlightNumber(flightNumber)) {
      errors.push('Format nomor penerbangan tidak valid (contoh: GA123, QZ8501)')
    }
    
    if (roomNumber && roomNumber.trim() !== '') {
      errors.push('Nomor kamar tidak diperlukan untuk layanan pick-up')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Helper function to validate pricing consistency - updated for boolean
export function validatePricingConsistency(
  surfboardCount: number,
  hasExcessBaggage: boolean,
  surfboardCost: number,
  baggageCost: number,
  totalCost: number,
  terminalCode?: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Calculate expected costs
  const expectedSurfboardCost = calculateSurfboardCost(surfboardCount)
  const expectedBaggageCost = calculateBaggageCost(hasExcessBaggage, terminalCode)
  const expectedTotalCost = calculateTotalCost(expectedSurfboardCost, expectedBaggageCost)
  
  // Allow for small floating point differences
  const tolerance = 0.01
  
  if (Math.abs(surfboardCost - expectedSurfboardCost) > tolerance) {
    errors.push(`Biaya surfboard tidak sesuai. Diharapkan: ${expectedSurfboardCost}, Diterima: ${surfboardCost}`)
  }
  
  if (Math.abs(baggageCost - expectedBaggageCost) > tolerance) {
    errors.push(`Biaya bagasi tidak sesuai. Diharapkan: ${expectedBaggageCost}, Diterima: ${baggageCost}`)
  }
  
  if (Math.abs(totalCost - expectedTotalCost) > tolerance) {
    errors.push(`Total biaya tidak sesuai. Diharapkan: ${expectedTotalCost}, Diterima: ${totalCost}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
