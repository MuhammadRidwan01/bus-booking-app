"use client"

// Store pending booking attempt
export function storePendingBooking(idempotencyKey: string, timestamp: number) {
  if (typeof window === 'undefined') return
  
  try {
    const pending = {
      key: idempotencyKey,
      timestamp,
      expiresAt: timestamp + (5 * 60 * 1000) // 5 minutes
    }
    localStorage.setItem('pending_booking', JSON.stringify(pending))
  } catch (error) {
    console.error('Failed to store pending booking:', error)
  }
}

// Get pending booking if exists and not expired
export function getPendingBooking(): { key: string; timestamp: number } | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem('pending_booking')
    if (!stored) return null
    
    const pending = JSON.parse(stored)
    const now = Date.now()
    
    // Check if expired (5 minutes)
    if (now > pending.expiresAt) {
      clearPendingBooking()
      return null
    }
    
    return { key: pending.key, timestamp: pending.timestamp }
  } catch (error) {
    console.error('Failed to get pending booking:', error)
    return null
  }
}

// Clear pending booking
export function clearPendingBooking() {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('pending_booking')
  } catch (error) {
    console.error('Failed to clear pending booking:', error)
  }
}

// Check if booking exists by idempotency key
export async function checkBookingByIdempotencyKey(idempotencyKey: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/check-booking?idempotency_key=${encodeURIComponent(idempotencyKey)}`)
    const result = await response.json()
    
    if (result.ok && result.bookingCode) {
      return result.bookingCode
    }
    
    return null
  } catch (error) {
    console.error('Failed to check booking:', error)
    return null
  }
}
