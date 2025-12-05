import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, MessageCircle, Copy, Home } from "lucide-react"
import Link from "next/link"
import BookingCode from "@/components/BookingCode"
import { getBookingByCode } from "@/app/actions/booking"
import { BookingStatusCard } from "@/components/BookingStatusCard"

async function ConfirmationContent({ searchParams }: { searchParams: { code?: string } }) {
  const bookingCode = searchParams.code || ''
  const { found, booking } = bookingCode ? await getBookingByCode(bookingCode) : { found: false, booking: null }
  const initialStatus = booking
    ? {
        whatsapp_sent: booking.whatsapp_sent,
        whatsapp_attempts: (booking as any)?.whatsapp_attempts ?? 0,
        whatsapp_last_error: booking.whatsapp_last_error ?? null,
      }
    : null

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Booking confirmed</h1>
          <p className="text-sm text-slate-600">Your ticket is recorded. We’ll send it to your WhatsApp.</p>
        </div>

        <BookingCode bookingCode={bookingCode} />

        <BookingStatusCard bookingCode={bookingCode} initialStatus={initialStatus} />

        <Card className="border border-slate-100 shadow-sm">
          <CardContent className="pt-5 space-y-3">
            <Instruction title="WhatsApp ticket" desc="Sent within a few minutes. Keep the number active." number="01" />
            <Instruction title="Save your booking code" desc="Use it to track or show the driver." number="02" />
            <Instruction title="Arrive early" desc="Be at the hotel lobby 10 minutes before departure." number="03" />
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Link href="/track" className="w-full">
            <Button variant="outline" className="w-full rounded-xl">
              <MessageCircle className="h-4 w-4 mr-2" />
              Track ticket
            </Button>
          </Link>

          <Link href="/" className="w-full">
            <Button className="w-full rounded-xl">
              <Home className="h-4 w-4 mr-2" />
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function ConfirmationPage({ searchParams }: { searchParams: { code?: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {/* @ts-expect-error Async Server Component */}
      <ConfirmationContent searchParams={searchParams} />
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
