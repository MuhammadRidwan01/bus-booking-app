import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, MessageCircle, Copy, Home } from "lucide-react"
import Link from "next/link"
import BookingCode from "@/components/BookingCode"
import { getBookingByCode } from "@/app/actions/booking"
import { BookingStatusCard } from "@/components/BookingStatusCard"
import { PublicShell } from "@/components/PublicShell"

type SearchParams = { code?: string }

async function ConfirmationContent({ searchParams }: { searchParams: SearchParams }) {
  const bookingCode = searchParams.code || ''
  const { found, booking } = bookingCode ? await getBookingByCode(bookingCode) : { found: false, booking: null }
  const initialStatus = booking
    ? {
        whatsapp_sent: booking.whatsapp_sent,
        whatsapp_attempts: (booking as any)?.whatsapp_attempts ?? 0,
        whatsapp_last_error: booking.whatsapp_last_error ?? null,
        has_whatsapp: (booking as any)?.has_whatsapp,
      }
    : null

  const showStatus = (booking as any)?.has_whatsapp !== false

  return (
    <PublicShell showBack backHref="/booking/ibis-style">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <div className="rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-100">
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-inner">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Booking confirmed</h1>
            <p className="text-sm text-slate-600">Your ticket is recorded. We’ll send it to your WhatsApp.</p>
          </div>
        </div>

        <BookingCode bookingCode={bookingCode} />

        {showStatus && (
          <BookingStatusCard bookingCode={bookingCode} initialStatus={initialStatus as any} />
        )}

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

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}))
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmationContent searchParams={resolvedSearchParams} />
    </Suspense>
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
