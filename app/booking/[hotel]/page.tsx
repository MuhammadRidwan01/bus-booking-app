"use client"

import { useRef, useState, useTransition, type ReactNode } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bus, User, Users, MapPin, Shield, KeyRound, Clock } from "lucide-react"
import Link from "next/link"
import { ScheduleSelector } from "@/components/ScheduleSelector"
import { useRealTimeCapacity } from "@/hooks/useRealTimeCapacity"
import Image from "next/image"
import { PublicShell } from "@/components/PublicShell"
import { BookingRecovery } from "@/components/BookingRecovery"

/* ------------------------------------------------------------
   PAGE
------------------------------------------------------------ */
export default function BookingPage() {
  const params = useParams()
  const hotelSlug = params.hotel as string

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [passengerCount, setPassengerCount] = useState<number>(1)
  const [roomNumber, setRoomNumber] = useState<string>("")
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [hasWhatsapp, setHasWhatsapp] = useState<string>("yes")
  const [countryCode, setCountryCode] = useState<string>("62")
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const formRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const { todaySchedules, tomorrowSchedules, loading } = useRealTimeCapacity(hotelSlug)

  const hotelName = hotelSlug === "ibis-style" ? "Ibis Style Jakarta Airport" : "Ibis Budget Jakarta Airport"
  const hotelShortName = hotelSlug === "ibis-style" ? "Ibis Style" : "Ibis Budget"
  
  const hotelImages = {
    "ibis-style": {
      logo: "/ibis-styles-logo.png",
      main: "/ISJA-depan.jpeg",
      photos: ["/ISJA-depan.jpeg", "/ISJA-resize.jpg", "/photi1a.jpg"]
    },
    "ibis-budget": {
      logo: "/ibis-budget-logo.png",
      main: "/IBJA-Depan.jpg",
      photos: ["/IBJA-Depan.jpg", "/photo2.jpg", "/Lobby-IBJA.jpg"]
    }
  }

  const currentHotel = hotelImages[hotelSlug as keyof typeof hotelImages]

  const handleScheduleSelect = (scheduleId: string, date: string) => {
    setSelectedScheduleId(scheduleId)
    setSelectedDate(date)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150)
  }

  const isFormValid =
    Boolean(selectedScheduleId && selectedDate && passengerCount >= 1 && roomNumber.trim() && idempotencyKey && phoneNumber.trim())

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formDataRef = useRef<FormData | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    formDataRef.current = formData
    
    // Store pending booking for recovery
    const { storePendingBooking } = await import("@/lib/booking-recovery")
    storePendingBooking(idempotencyKey, Date.now())
    
    // Optimistic navigation - navigate immediately
    startTransition(() => {
      router.push(`/booking/confirmation?code=loading`)
    })

    try {
      // Import the optimistic version with timeout
      const { createBookingOptimistic } = await import("@/app/actions/booking")
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timeout - please try again")), 30000)
      )
      
      const result = await Promise.race([
        createBookingOptimistic(formData),
        timeoutPromise
      ]) as { success: boolean; bookingCode?: string; error?: string }
      
      if (result.success && result.bookingCode) {
        // Success - clear pending and replace URL with actual booking code
        const { clearPendingBooking } = await import("@/lib/booking-recovery")
        clearPendingBooking()
        router.replace(`/booking/confirmation?code=${result.bookingCode}`)
        setIsSubmitting(false)
      } else {
        // Failed - stay on page and show error
        handleBookingError(result.error || "Booking failed")
      }
    } catch (err: any) {
      handleBookingError(err?.message || "Booking failed, please try again")
    }
  }

  function handleBookingError(errorMessage: string) {
    // Clear pending booking
    import("@/lib/booking-recovery").then(({ clearPendingBooking }) => {
      clearPendingBooking()
    })
    
    // Navigate back to booking page (stay on current page)
    router.replace(`/booking/${hotelSlug}`)
    
    // Map error messages to user-friendly English
    let displayError = errorMessage
    if (errorMessage.includes('Kapasitas tidak mencukupi') || errorMessage.includes('capacity')) {
      displayError = '❌ Sorry, the shuttle is fully booked for this schedule. Please choose another time.'
    } else if (errorMessage.includes('timeout')) {
      displayError = '⏱️ Request timed out. Please try again.'
    } else if (errorMessage.includes('network')) {
      displayError = '🌐 Network error occurred. Please check your connection.'
    } else if (errorMessage.includes('Jadwal tidak ditemukan') || errorMessage.includes('not found')) {
      displayError = '📅 Schedule not found. Please select an available schedule.'
    }
    
    // Show error message on the form
    setError(displayError)
    setIsSubmitting(false)
    
    // Scroll to form to show error message
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 200)
  }

  return (
    <PublicShell showBack backHref="/">
      <BookingRecovery />
      <div className="space-y-6">

        {/* HOTEL HEADER CARD */}
        <Card className="overflow-hidden border border-slate-100 shadow-lg rounded-2xl">
          <div className="relative h-56 sm:h-64 md:h-72">
            {currentHotel?.main && (
              <Image src={currentHotel.main} alt={hotelName} fill priority className="object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8 text-white">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-white/90 rounded-2xl p-2 shadow-md">
                  <Image src={currentHotel.logo} alt={`${hotelShortName} logo`} width={60} height={60} className="object-contain" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/70">Hotel pickup</p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">{hotelName}</h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-white/80">
                <BadgeInfo icon={<MapPin />} label="Jakarta Airport" />
                <BadgeInfo icon={<Clock />} label="06:00 - 22:00" />
                <BadgeInfo icon={<Shield />} label="Free for guests" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50">
            {currentHotel?.photos.slice(0, 3).map((p, i) => (
              <div key={i} className="relative h-20 sm:h-24 rounded-xl overflow-hidden">
                <Image src={p} alt={hotelName} fill className="object-cover" />
              </div>
            ))}
          </div>
        </Card>

        {/* STEPS */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <StepPill active>1. Choose schedule</StepPill>
            <StepPill active={Boolean(selectedScheduleId)}>2. Passenger details</StepPill>
          </div>

          {/* GRID — SCHEDULE + FORM */}
          <div className="grid lg:grid-cols-[1.6fr,1fr] gap-8 items-start">

            {/* SCHEDULE */}
            <div className="space-y-4">
              <ScheduleSelector
                todaySchedules={todaySchedules}
                tomorrowSchedules={tomorrowSchedules}
                selectedScheduleId={selectedScheduleId}
                onScheduleSelect={handleScheduleSelect}
                loading={loading}
              />

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Next step</p>
                  <p className="text-xs text-slate-600">Fill passenger details after choosing a schedule.</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl"
                  disabled={!selectedScheduleId}
                  onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  Open passenger form
                </Button>
              </div>
            </div>

            {/* FORM SIDEBAR */}
            <div className="space-y-6 lg:sticky lg:top-24" ref={formRef}>
              <Card className="shadow-lg border border-slate-100 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xl md:text-2xl text-slate-900">
                    <User className="h-6 w-6 text-primary" />
                    Passenger Details
                  </CardTitle>
                  <p className="text-sm text-slate-600">Ticket is sent to WhatsApp after confirmation.</p>
                </CardHeader>

                <CardContent className="pt-4">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <input type="hidden" name="scheduleId" value={selectedScheduleId || ""} />
                    <input type="hidden" name="bookingDate" value={selectedDate} />
                    <input type="hidden" name="passengerCount" value={passengerCount} />
                    <input type="hidden" name="roomNumber" value={roomNumber} />
                    <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

                    {/* FORM — NAME */}
                    <FormField label="Full name">
                      <Input
                        id="customerName"
                        name="customerName"
                        required
                        placeholder="Full name as per ID"
                        className="h-11 rounded-xl"
                      />
                    </FormField>

                    {/* WHATSAPP */}
                    <FormField label="WhatsApp number">
                      <div className="grid grid-cols-[120px_1fr] gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-slate-500">+</span>
                          <Input
                            name="countryCode"
                            type="tel"
                            list="dial-codes"
                            className="h-11 rounded-xl px-2"
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="62"
                          />
                        </div>
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          type="tel"
                          required
                          placeholder="812xxxxxx"
                          className="h-11 rounded-xl flex-1"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                      <datalist id="dial-codes">
                        {dialCodeOptions.map((opt) => (
                          <option key={opt.code} value={opt.dial}>{`${opt.label}`}</option>
                        ))}
                      </datalist>

                      <Label className="text-xs font-semibold text-slate-700 mt-2">Is this number active on WhatsApp?</Label>
                      <Select name="hasWhatsapp" value={hasWhatsapp} onValueChange={setHasWhatsapp}>
                        <SelectTrigger className="h-10 rounded-xl">
                          <SelectValue placeholder="WhatsApp status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes, active</SelectItem>
                          <SelectItem value="no">No / not active</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    {/* PASSENGERS + ROOM */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField label="Number of passengers">
                        <Select
                          value={passengerCount.toString()}
                          onValueChange={(v) => setPassengerCount(Number(v))}
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Select total" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <SelectItem key={n} value={n.toString()}>{n} person</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField label="Room number">
                        <div className="relative">
                          <Input
                            id="roomNumber"
                            required
                            placeholder="e.g., 101, 205"
                            className="h-11 rounded-xl pl-11"
                            value={roomNumber}
                            onChange={(e) => setRoomNumber(e.target.value)}
                          />
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                      </FormField>
                    </div>

                    {/* ERRORS */}
                    {error && (
                      <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 shadow-md animate-in slide-in-from-top-2">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <svg className="h-5 w-5 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-rose-900 mb-1">Booking Failed</h4>
                            <p className="text-sm text-rose-800">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUBMIT */}
                    <div className="pt-2 space-y-3">
                      <Button
                        type="submit"
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                        disabled={!isFormValid || isSubmitting || isPending}
                      >
                        {isSubmitting || isPending ? "Processing..." : isFormValid ? "✓ Confirm Booking" : "Complete booking details"}
                      </Button>
                      {!isFormValid && (
                        <div className="text-center text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                          Choose a schedule and fill all fields to continue.
                        </div>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* INFO BOX */}
              <Card className="border border-slate-100 shadow-md rounded-2xl">
                <CardContent className="p-5 space-y-2">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Important info
                  </h3>
                  <ul className="space-y-1 text-sm text-slate-700">
                    <li>Arrive at the lobby 10 minutes before departure.</li>
                    <li>Show your WhatsApp ticket when boarding.</li>
                    <li>Ensure room number and passenger count are correct.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

      </div>
    </PublicShell>
  )
}

/* ------------------------------------------------------------
   COMPONENTS
------------------------------------------------------------ */

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-800">{label}</Label>
      {children}
    </div>
  )
}

function BadgeInfo({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20">
      {icon}
      {label}
    </span>
  )
}

function StepPill({ active, children }: { active?: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
        active ? "bg-primary/10 text-primary border-primary/20" : "bg-white text-slate-600 border-slate-200"
      }`}
    >
      {children}
    </span>
  )
}

const countryOptions = [
  { code: "ID", dial: "62", label: "Indonesia" },
  { code: "SG", dial: "65", label: "Singapore" },
  { code: "MY", dial: "60", label: "Malaysia" },
  { code: "PH", dial: "63", label: "Philippines" },
  { code: "VN", dial: "84", label: "Vietnam" },
  { code: "TH", dial: "66", label: "Thailand" },
  { code: "US", dial: "1", label: "United States" },
  { code: "GB", dial: "44", label: "United Kingdom" },
  { code: "AU", dial: "61", label: "Australia" },
  { code: "NZ", dial: "64", label: "New Zealand" },
  { code: "IN", dial: "91", label: "India" },
  { code: "AE", dial: "971", label: "UAE" },
  { code: "SA", dial: "966", label: "Saudi Arabia" },
]

const dialCodeOptions = countryOptions

function countryToDialCode(country?: string) {
  if (!country) return null
  const found = countryOptions.find((c) => c.code === country)
  return found?.dial ?? null
}
