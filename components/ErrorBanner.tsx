"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertCircle, X } from "lucide-react"

export function ErrorBanner() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true)
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => setShow(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [error])

  if (!show || !error) return null

  const errorMessages: Record<string, string> = {
    timeout: "Booking request timed out. Please try again.",
    failed: "Booking failed. Please check your details and try again.",
    network: "Network error. Please check your connection and try again.",
  }

  const message = errorMessages[error] || "An error occurred. Please try again."

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-5">
      <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-rose-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-rose-900">Booking Error</h3>
            <p className="text-sm text-rose-700 mt-1">{message}</p>
          </div>
          <button
            onClick={() => setShow(false)}
            className="flex-shrink-0 text-rose-400 hover:text-rose-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
