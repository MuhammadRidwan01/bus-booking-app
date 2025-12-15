import { Suspense } from "react"
import Link from "next/link"
import { PublicShell } from "@/components/PublicShell"
import { ConfirmationView } from "@/components/ConfirmationView"
import { ConfirmationSkeleton } from "@/components/ConfirmationSkeleton"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { Button } from "@/components/ui/button"
import { Home, AlertCircle } from "lucide-react"
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

  return (
    <PublicShell showBack backHref="/booking/ibis-styles">
      <Suspense fallback={<ConfirmationSkeleton />}>
        <AsyncBookingLoader code={bookingCode} />
      </Suspense>
    </PublicShell>
  )
}

async function AsyncBookingLoader({ code }: { code: string }) {
  // 1. Validation
  if (!code || code === 'loading' || code.length < 3) {
    // Show skeleton if explicitly 'loading' (client transition)
    if (code === 'loading') return <ConfirmationSkeleton />
    return <InvalidBookingState />
  }

  // 2. Fetch Data
  const supabase = await getSupabaseAdmin()
  const { data: booking, error } = await supabase
    .from("booking_details")
    .select("*")
    .eq("booking_code", code)
    .single()

  if (error || !booking) {
    console.error("Booking fetch error:", error)
    return <InvalidBookingState />
  }

  // 3. Render View
  return <ConfirmationView initialBooking={booking} bookingCode={code} />
}

function InvalidBookingState() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 py-12">
      <div className="rounded-3xl bg-rose-50 p-6 shadow-sm ring-1 ring-rose-200">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-inner">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Booking Not Found</h1>
          <p className="text-sm text-slate-600">The booking code is missing or invalid. Please try booking again.</p>
        </div>
      </div>

      <div className="space-y-3">
        <Link href="/" className="w-full">
          <Button className="w-full rounded-xl h-12">
            <Home className="mr-2 h-4 w-4" />
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  )
}
