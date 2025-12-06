"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Download } from "lucide-react"

type StatusData = {
  whatsapp_sent: boolean
  whatsapp_attempts: number
  whatsapp_last_error: string | null
}

type Props = {
  bookingCode: string
  initialStatus: StatusData | null
}

const MAX_CHECKS = 8

export function BookingStatusCard({ bookingCode, initialStatus }: Props) {
  const [status, setStatus] = useState<StatusData | null>(initialStatus)
  const [checks, setChecks] = useState(0)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const statusSentRef = useRef(status?.whatsapp_sent ?? false)
  const checksRef = useRef(checks)

  useEffect(() => {
    statusSentRef.current = status?.whatsapp_sent ?? false
  }, [status?.whatsapp_sent])

  useEffect(() => {
    checksRef.current = checks
  }, [checks])

  useEffect(() => {
    let cancelled = false
    if (!bookingCode) return

    const fetchStatus = async (nextCheck: boolean) => {
      if (cancelled) return
      if (statusSentRef.current) return
      if (nextCheck && checksRef.current >= MAX_CHECKS) return

      setLoading(true)
      try {
        const res = await fetch(`/api/booking-status?code=${bookingCode}`)
        const json = await res.json()
        if (cancelled) return
        if (json?.ok) {
          setStatus(json.data)
        }
      } catch (err) {
        console.error("Failed to fetch booking status", err)
      } finally {
        if (!cancelled) {
          setChecks((c) => c + (nextCheck ? 1 : 0))
          setLoading(false)
        }
      }
    }

    // initial fetch counts as first check
    fetchStatus(true)
    const timer = setInterval(() => fetchStatus(true), 3500)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [bookingCode])

  const skipByUser =
    (status?.whatsapp_last_error ?? "").toLowerCase().includes("user indicated number is not on whatsapp")

  const showResend = !status?.whatsapp_sent && checks >= MAX_CHECKS && !skipByUser

  const handleResend = async () => {
    if (!bookingCode || skipByUser) return
    setResending(true)
    setResendError(null)
    try {
      const res = await fetch("/api/resend-wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: bookingCode }),
      })
      const json = await res.json()
      if (!json?.ok) {
        setResendError(json?.error || "Failed to resend")
      } else {
        // refresh status once after resend
        setStatus((prev) =>
          prev
            ? { ...prev, whatsapp_sent: true, whatsapp_last_error: null, has_whatsapp: true }
            : { whatsapp_sent: true, whatsapp_attempts: 1, whatsapp_last_error: null, has_whatsapp: true },
        )
      }
    } catch (err) {
      setResendError("Failed to resend (network)")
    } finally {
      setResending(false)
    }
  }

  const waStatusLabel = skipByUser
    ? "Ticket recorded"
    : status?.whatsapp_sent
      ? "Ticket recorded & sent to WhatsApp"
      : "Ticket recorded — sending to WhatsApp"

  const waStatusColor = skipByUser
    ? "bg-slate-50 text-slate-800 border-slate-200"
    : status?.whatsapp_sent
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : "bg-amber-50 text-amber-800 border-amber-200"

  return (
    <Card className="border border-slate-100 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-900">Ticket Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold flex items-center gap-2 ${waStatusColor}`}>
          {status?.whatsapp_sent || skipByUser ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
          <span>{waStatusLabel}{loading && !status?.whatsapp_sent && !skipByUser ? " (checking...)" : ""}</span>
        </div>

        {skipByUser && bookingCode && (
          <div className="space-y-2">
            <a
              href={`/api/ticket/${bookingCode}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
              download
            >
              <Download className="h-4 w-4" />
              Download PDF Ticket
            </a>
          </div>
        )}

        {!skipByUser && status?.whatsapp_last_error && !status.whatsapp_sent && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            Auto-send failed: {status.whatsapp_last_error}. Ticket is still recorded.
          </div>
        )}

        {!skipByUser && showResend && (
          <div className="space-y-2">
            <Button onClick={handleResend} className="w-full rounded-xl" disabled={resending}>
              {resending ? "Resending..." : "Resend ticket to WhatsApp"}
            </Button>
            {resendError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {resendError}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
