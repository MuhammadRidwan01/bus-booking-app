import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, MessageCircle, Home, AlertCircle } from "lucide-react"
import Link from "next/link"
import BookingCode from "@/components/BookingCode"
import { BookingStatusCard } from "@/components/BookingStatusCard"
import { PublicShell } from "@/components/PublicShell"
import type { Metadata } from "next"

type SearchParams = { code?: string }

export const metadata: Metadata = {
  title: "Booking Confirmed | Ibis Jakarta Airport Shuttle",
  description: "Your shuttle booking has been confirmed",
}

// Force dynamic rendering for instant response
export const dynamic = 'force-dynamic'

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({ code: '' }))
  const bookingCode = resolvedSearchParams.code || ''

  // Show loading state if code is "loading"
  if (bookingCode === 'loading') {
    const { ConfirmationTimeout } = await import("@/components/ConfirmationTimeout")
    return (
      <PublicShell showBack backHref="/booking/ibis-style">
        <ConfirmationTimeout />
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
          <div className="rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-100 animate-pulse">
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-inner">
                <CheckCircle className="h-10 w-10 animate-pulse" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-900">Processing booking...</h1>
              <p className="text-sm text-slate-600">Please wait while we confirm your reservation.</p>
            </div>
          </div>
        </div>
      </PublicShell>
    )
  }

  // Validate booking code format
  if (!bookingCode || bookingCode.length < 8) {
    return (
      <PublicShell showBack backHref="/">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
          <div className="rounded-3xl bg-rose-50 p-6 shadow-sm ring-1 ring-rose-200">
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-inner">
                <AlertCircle className="h-10 w-10" />
              </div>
              <h1 className="text-2xl font-semibold text-slate-900">Invalid Booking Code</h1>
              <p className="text-sm text-slate-600">The booking code is missing or invalid. Please try booking again.</p>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/" className="w-full">
              <Button className="w-full rounded-xl">
                <Home className="mr-2 h-4 w-4" />
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </PublicShell>
    )
  }

  // Optimistic initial status - assume WhatsApp will be sent
  const optimisticStatus = {
    whatsapp_sent: false,
    whatsapp_attempts: 0,
    whatsapp_last_error: null,
    has_whatsapp: true,
  }

  return (
    <PublicShell showBack backHref="/booking/ibis-style">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <div className="rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-100">
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-inner">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Booking confirmed</h1>
            <p className="text-sm text-slate-600">Your ticket is recorded. We&apos;ll send it to your WhatsApp.</p>
          </div>
        </div>

        <BookingCode bookingCode={bookingCode} />

        <BookingStatusCard bookingCode={bookingCode} initialStatus={optimisticStatus} />

        <Card className="border border-slate-100 shadow-sm">
          <CardContent className="space-y-3 pt-5">
            <Instruction title="WhatsApp ticket" desc="Sent within a few minutes. Keep the number active." number="01" />
            <Instruction title="Save your booking code" desc="Use it to track or show the driver." number="02" />
            <Instruction title="Arrive early" desc="Be at the hotel lobby 10 minutes before departure." number="03" />
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Link href="/track" className="w-full">
            <Button variant="outline" className="w-full rounded-xl">
              <MessageCircle className="mr-2 h-4 w-4" />
              Track ticket
            </Button>
          </Link>

          <Link href="/" className="w-full">
            <Button className="w-full rounded-xl">
              <Home className="mr-2 h-4 w-4" />
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    </PublicShell>
  )
}

function Instruction({ title, desc, number }: { title: string; desc: string; number: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-semibold">
        {number}
      </div>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-600">{desc}</p>
      </div>
    </div>
  )
}
