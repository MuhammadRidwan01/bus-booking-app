import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isToday, setHours, setMinutes, isAfter } from "date-fns"
import { id } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateBookingCode(): string {
  const prefix = "IBX"
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substr(2, 3).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd MMMM yyyy", { locale: id })
}

export function formatTime(time: string): string {
  return format(new Date(`2000-01-01T${time}`), "HH:mm")
}

export function getCapacityStatus(current: number, max: number): "available" | "almost-full" | "full" {
  const percentage = (current / max) * 100

  if (percentage >= 100) return "full"
  if (percentage >= 80) return "almost-full"
  return "available"
}

export function isScheduleAvailable(departureTime: string, scheduleDate: string): boolean {
  const now = new Date()
  const scheduleDateTime = new Date(scheduleDate)

  if (isToday(scheduleDateTime)) {
    const [hours, minutes] = departureTime.split(":")
    const departureDateTime = setHours(setMinutes(new Date(scheduleDateTime), Number(minutes)), Number(hours))
    const twentyMinutesBefore = new Date(departureDateTime.getTime() - 20 * 60 * 1000)
    return isAfter(twentyMinutesBefore, now)
  }

  return true
}

export function formatPhoneNumber(phone: string): string {
  // Convert to WhatsApp format
  if (phone.startsWith("0")) {
    return "62" + phone.slice(1)
  }
  if (phone.startsWith("+62")) {
    return phone.slice(1)
  }
  if (phone.startsWith("62")) {
    return phone
  }
  return "62" + phone
}
