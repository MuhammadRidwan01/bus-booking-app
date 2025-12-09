"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Bus, Calendar, Clock, MapPin, Users, Phone, Download } from "lucide-react"
import { getBookingByCode } from "@/app/actions/booking"
import type { BookingDetails } from "@/types"
import { formatDate, formatTime } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import { BookingStatusCard } from "@/components/BookingStatusCard"
import { PublicShell } from "@/components/PublicShell"
import TrackSkeleton from "@/components/TrackSkeleton"

export default function TrackPage() {
  const [bookingCode, setBookingCode] = useState("")
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const searchParams = useSearchParams()

  const searchBooking = async (code: string) => {
    if (!code.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const result = await getBookingByCode(code.trim().toUpperCase())
      setBooking(result.found ? result.booking : null)
    } catch (error) {
      console.error("Search error:", error)
      setBooking(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    await searchBooking(bookingCode)
  }

  useEffect(() => {
    const code = searchParams.get("code")
    if (code) {
      setBookingCode(code.toUpperCase())
      searchBooking(code)
    }
  }, [searchParams])

  return (
    <PublicShell showBack backHref="/">
      <div className="mx-auto flex w-full max-w-2xl flex-col space-y-6">
        <Card className="border border-slate-100 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Search className="h-5 w-5 text-primary" />
              Enter your booking code
            </CardTitle>
            <p className="text-sm text-slate-600">Find the code in WhatsApp or on the confirmation page.</p>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bookingCode" className="text-sm font-semibold text-slate-800">
                  Booking Code
                </Label>
                <div className="relative">
                  <Input
                    id="bookingCode"
                    type="text"
                    placeholder="Example: IBX1A2B3C4D"
                    value={bookingCode}
                    onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                    className="h-11 rounded-xl pl-10 font-mono text-lg"
                    required
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500">Use the code sent after your booking succeeds.</p>
              </div>

              <Button type="submit" className="h-11 w-full rounded-xl text-base font-semibold shadow-md shadow-primary/15" disabled={loading}>
                {loading ? "Searching..." : "Track ticket"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {searched && (
          <>
            {loading ? (
              <TrackSkeleton />
            ) : booking ? (
              <Card className="overflow-hidden border border-slate-100 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Bus className="h-5 w-5" />
                    Ticket details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white shadow-inner">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70">Booking Code</p>
                    <p className="mt-1 text-3xl font-mono font-bold tracking-[0.2em]">{booking.booking_code}</p>
                  </div>

                  {(booking.whatsapp_sent || (booking.whatsapp_attempts ?? 0) > 0 || booking.phone) && (
                    <Button
                      onClick={() => {
                        if (downloading) return
                        setDownloading(true)
                        
                        const link = document.createElement('a')
                        link.href = `/api/ticket/${booking.booking_code}`
                        link.download = `shuttle-ticket-${booking.booking_code}.pdf`
                        link.style.display = 'none'
                        document.body.appendChild(link)
                        link.click()
                        
                        // Clean up and reset state after a delay
                        setTimeout(() => {
                          document.body.removeChild(link)
                          setDownloading(false)
                        }, 2000)
                      }}
                      disabled={downloading}
                      className="w-full rounded-xl bg-slate-900 hover:bg-slate-800"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloading ? 'Downloading...' : 'Download PDF Ticket'}
                    </Button>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoCard icon={<Users className="h-4 w-4" />} title="Passenger name" value={booking.customer_name} />
                    <InfoCard icon={<Phone className="h-4 w-4" />} title="WhatsApp number" value={`+${booking.phone}`} />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoCard icon={<Bus className="h-4 w-4" />} title="Hotel" value={booking.hotel_name} />
                    {booking.room_number && <InfoCard icon={<MapPin className="h-4 w-4" />} title="Room" value={booking.room_number} />}
                    <InfoCard icon={<Calendar className="h-4 w-4" />} title="Date" value={formatDate(booking.schedule_date)} />
                    <InfoCard icon={<Clock className="h-4 w-4" />} title="Departure" value={`${formatTime(booking.departure_time)} WIB`} />
                    <InfoCard icon={<MapPin className="h-4 w-4" />} title="Destination" value={booking.destination} />
                    <InfoCard icon={<Users className="h-4 w-4" />} title="Passengers" value={`${booking.passenger_count} people`} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <span className="font-semibold text-slate-800">Ticket status</span>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${
                          booking.status === "confirmed" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {booking.status === "confirmed" ? "Confirmed" : "Cancelled"}
                      </span>
                    </div>

                    <BookingStatusCard
                      bookingCode={booking.booking_code}
                      initialStatus={{
                        whatsapp_sent: booking.whatsapp_sent,
                        whatsapp_attempts: booking.whatsapp_attempts ?? 0,
                        whatsapp_last_error: booking.whatsapp_last_error ?? null,
                        has_whatsapp: (booking as any).has_whatsapp,
                      }}
                    />
                  </div>

                  {booking.status === "confirmed" && (
                    <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      <p className="font-semibold text-amber-900">Departure instructions</p>
                      <p>Arrive at the lobby 10 minutes before departure.</p>
                      <p>Show your WhatsApp ticket to the driver.</p>
                      <p>Bring a valid ID.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-slate-100 shadow-md">
                <CardContent className="space-y-4 py-10 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <Search className="h-8 w-8 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-slate-900">Ticket not found</h3>
                    <p className="text-sm text-slate-600">Please check the booking code you entered.</p>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>Make sure the code matches the one sent on WhatsApp.</p>
                    <p>Avoid spaces or extra characters.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </PublicShell>
  )
}

function InfoCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm flex items-start gap-2">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

// Skeleton moved to `components/TrackSkeleton.tsx`
