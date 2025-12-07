// ============================================================================
// MINIMAL PUBLIC TYPES - Frontend UI Only
// These types contain NO database internals (no IDs, created_at, foreign keys)
// ============================================================================

/**
 * Booking form input data (user-provided fields only)
 */
export interface BookingFormData {
  customerName: string
  phoneNumber: string
  countryCode: string
  bookingDate: string
  scheduleId: string
  passengerCount: number
  roomNumber: string
  hasWhatsapp: "yes" | "no"
  idempotencyKey: string
}

/**
 * Booking confirmation display data (output only, no sensitive fields)
 */
export interface BookingConfirmation {
  bookingCode: string
  customerName: string
  hotelName: string
  departureTime: string
  destination: string
  scheduleDate: string
  passengerCount: number
  roomNumber?: string
  status: "confirmed" | "cancelled"
  whatsappSent: boolean
}

/**
 * Schedule display data for UI (no database IDs or internal fields)
 */
export interface ScheduleDisplay {
  scheduleId: string
  departureTime: string
  destination: string
  availableSeats: number
  totalCapacity: number
  status: "available" | "almost-full" | "full"
  scheduleDate: string
  isPast?: boolean
}

/**
 * Hotel display data (minimal, UI-focused)
 */
export interface HotelDisplay {
  name: string
  slug: string
}

// ============================================================================
// LEGACY TYPES - For backward compatibility with existing code
// These will be gradually removed as we migrate to Edge Functions
// ============================================================================

export interface Hotel {
  id: string
  name: string
  slug: string
  is_active: boolean
}

export interface BusSchedule {
  id: string
  hotel_id: string
  departure_time: string
  destination: string
  max_capacity: number
  is_active: boolean
}

export interface DailySchedule {
  id: string
  bus_schedule_id: string
  schedule_date: string
  current_booked: number
  status: "active" | "full" | "expired" | "cancelled"
  bus_schedules: BusSchedule
}

export interface Booking {
  id: string
  booking_code: string
  hotel_id: string
  daily_schedule_id: string
  customer_name: string
  phone: string
  passenger_count: number
  status: "confirmed" | "cancelled"
  whatsapp_sent: boolean
  whatsapp_attempts?: number
  whatsapp_last_error?: string | null
  created_at: string
}

export interface BookingDetails extends Booking {
  hotel_name: string
  departure_time: string
  destination: string
  schedule_date: string
  room_number?: string
}

export interface ScheduleWithCapacity {
  id: string
  departure_time: string
  destination: string
  current_booked: number
  max_capacity: number
  status: "available" | "almost-full" | "full"
  schedule_date: string
  isPast?: boolean
}

export interface RoomNumber {
  id: string
  hotel_id: string
  room_number: string
  is_active: boolean
}
