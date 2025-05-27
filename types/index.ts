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
