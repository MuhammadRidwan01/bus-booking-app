"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getPendingBooking, clearPendingBooking, checkBookingByIdempotencyKey } from "@/lib/booking-recovery"
import { Loader2, CheckCircle } from "lucide-react"

export function BookingRecovery() {
  const router = useRouter()
  const [checking, setChecking] = useState(false)
  const [recovered, setRecovered] = useState(false)

  useEffect(() => {
    async function checkPendingBooking() {
      const pending = getPendingBooking()
      
      if (!pending) return

      setChecking(true)

      try {
        // Check if booking was created with this idempotency key
        const bookingCode = await checkBookingByIdempotencyKey(pending.key)
        
        if (bookingCode) {
          // Booking found! Clear pending and redirect
          clearPendingBooking()
          setRecovered(true)
          
          // Small delay to show success message
          setTimeout(() => {
            router.replace(`/booking/confirmation?code=${bookingCode}`)
          }, 1500)
        } else {
          // No booking found yet, clear if too old (>2 minutes)
          const age = Date.now() - pending.timestamp
          if (age > 2 * 60 * 1000) {
            clearPendingBooking()
          }
          setChecking(false)
        }
      } catch (error) {
        console.error("Error checking pending booking:", error)
        setChecking(false)
      }
    }

    // Check on mount
    checkPendingBooking()

    // Also check every 3 seconds for up to 30 seconds
    const interval = setInterval(checkPendingBooking, 3000)
    const timeout = setTimeout(() => clearInterval(interval), 30000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [router])

  if (!checking && !recovered) return null

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-5">
      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {recovered ? (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            ) : (
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900">
              {recovered ? "Booking Found!" : "Checking Previous Booking..."}
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              {recovered 
                ? "Redirecting to your confirmation page..." 
                : "We're checking if your previous booking was successful."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
