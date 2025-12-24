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
  flightNumber: string
  roomNumber?: string
  hasWhatsapp: "yes" | "no"
  idempotencyKey: string
  serviceType: "drop_off" | "pick_up"
  terminalCode?: string
  meetingPointId?: string
  // Enhanced booking fields
  hasSurfboard: boolean
  surfboardCount: number
  hasExcessBaggage: boolean
  excessBaggageCount: number // Keep for backward compatibility
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
  flightNumber?: string
  roomNumber?: string
  status: "confirmed" | "cancelled"
  whatsappSent: boolean
  serviceType: "drop_off" | "pick_up"
  terminalCode?: string
  meetingPointInfo?: TerminalMeetingPoint
  // Enhanced booking fields
  hasSurfboard: boolean
  surfboardCount: number
  hasExcessBaggage: boolean
  excessBaggageCount: number // Keep for backward compatibility
  surfboardCost: number
  baggageCost: number
  totalCost: number
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
  serviceType: "drop_off" | "pick_up"
  isPast?: boolean
}

/**
 * Terminal meeting point information
 */
export interface TerminalMeetingPoint {
  id: string
  terminalCode: string
  locationDescription: string
  arrivalTimeOffsetMin: number
  arrivalTimeOffsetMax: number
}

/**
 * Pricing configuration for additional services
 */
export interface PricingConfig {
  id: string
  surfboardCostPerBoard: number
  baggageFreeItemsPerPassenger: number
  baggageTerminal3CurbsideCost: number
  baggageOtherTerminalsCost: number
  currency: string
  effectiveDate: string
  createdBy: string
  createdAt: string
  isActive: boolean
}

/**
 * Cost calculation result
 */
export interface CostCalculation {
  surfboardCost: number
  baggageCost: number
  totalCost: number
}

/**
 * Pricing breakdown item for display
 */
export interface PricingItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
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
  // Enhanced booking fields
  room_number?: string
  flight_number?: string
  has_surfboard: boolean
  surfboard_count: number
  has_excess_baggage: boolean
  excess_baggage_count: number // Keep for backward compatibility
  surfboard_cost: number
  baggage_cost: number
  total_cost: number
}

export interface BookingDetails extends Booking {
  hotel_name: string
  departure_time: string
  destination: string
  schedule_date: string
  flight_number?: string
  room_number?: string
  service_type?: "drop_off" | "pick_up"
  terminal_code?: string
  meeting_point_id?: string
  meeting_point_location?: string
  arrival_time_offset_min?: number
  arrival_time_offset_max?: number
  // Enhanced booking fields are inherited from Booking
}

export interface ScheduleWithCapacity {
  id: string
  departure_time: string
  destination: string
  current_booked: number
  max_capacity: number
  status: "available" | "almost-full" | "full"
  schedule_date: string
  service_type?: "drop_off" | "pick_up"
  isPast?: boolean
}

export interface FlightNumber {
  id: string
  hotel_id: string
  flight_number: string
  is_active: boolean
}
