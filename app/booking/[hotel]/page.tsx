"use client"

import { useRef, useState, useTransition, useEffect, type ReactNode } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Shield, Clock, Loader2, MapPin } from "lucide-react"
import { ScheduleSelector } from "@/components/ScheduleSelector"
import { useRealTimeCapacity } from "@/hooks/useRealTimeCapacity"
import { ServiceTypeSelector } from "@/components/ServiceTypeSelector"
import { TerminalSelector } from "@/components/TerminalSelector"
import { useTerminalMeetingPoints } from "@/hooks/useTerminalMeetingPoints"
import { ServiceSpecificFields } from "@/components/ServiceSpecificFields"
import { SurfboardSelector } from "@/components/SurfboardSelector"
import { PricingBreakdown } from "@/components/PricingBreakdown"
import { usePricingState } from "@/hooks/usePricing"
import Image from "next/image"
import { PublicShell } from "@/components/PublicShell"
import { BookingRecovery } from "@/components/BookingRecovery"

function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export default function BookingPage() {
  const router = useRouter()
  const params = useParams()
  const hotelSlug = params.hotel as string

  useEffect(() => {
    if (hotelSlug === "ibis-style") {
      router.replace("/booking/ibis-styles")
    }
  }, [hotelSlug, router])

  const [bookingStep, setBookingStep] = useState<1 | 2>(1)
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedServiceType, setSelectedServiceType] = useState<"drop_off" | "pick_up" | null>(null)
  const [selectedTerminalCode, setSelectedTerminalCode] = useState<string | null>(null)
  const [selectedMeetingPointId, setSelectedMeetingPointId] = useState<string | null>(null)
  const [passengerCount, setPassengerCount] = useState<number>(1)
  const [roomNumber, setRoomNumber] = useState<string>("")
  const [flightNumber, setFlightNumber] = useState<string>("")
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [surfboardCount, setSurfboardCount] = useState<number>(0)
  const [countryCode, setCountryCode] = useState<string>("62")
  const [customerName, setCustomerName] = useState<string>("")
  const [idempotencyKey] = useState(() => generateUUID())

  const [isPending, startTransition] = useTransition()

  const {
    setSurfboardCount: setPricingSurfboardCount,
    setExcessBaggageCount,
    setTerminalCode: setPricingTerminalCode,
    setPassengerCount: setPricingPassengerCount,
    pricing,
    config,
    hasSurfboard,
    hasExcessBaggage,
    excessBaggageCount
  } = usePricingState({
    passengerCount: 1,
    surfboardCount: 0,
    hasExcessBaggage: false,
    terminalCode: undefined
  })

  const { todaySchedules, tomorrowSchedules, loading } = useRealTimeCapacity(hotelSlug, selectedServiceType || undefined)
  const { terminalMeetingPoints, loading: terminalLoading } = useTerminalMeetingPoints()

  const hotelName = hotelSlug === "ibis-styles" ? "Ibis styles Jakarta Airport" : "ibis Budget Jakarta Airport"
  const hotelShortName = hotelSlug === "ibis-styles" ? "ibis styles" : "ibis Budget"

  const hotelImages = {
    "ibis-styles": { logo: "/ibis-styles-logo.png", main: "/ISJA-depan.jpeg", photos: ["/ISJA-depan.jpeg", "/ISJA-resize.jpg", "/photi1a.jpg"] },
    "ibis-budget": { logo: "/ibis-budget-logo.png", main: "/IBJA-Depan.jpg", photos: ["/IBJA-Depan.jpg", "/photo2.jpg", "/Lobby-IBJA.jpg"] }
  }

  const currentHotel = hotelImages[hotelSlug as keyof typeof hotelImages]

  const handleScheduleSelect = (scheduleId: string, date: string) => {
    setSelectedScheduleId(scheduleId)
    setSelectedDate(date)
    if (selectedServiceType === "pick_up") {
      setTimeout(() => {
        const terminalSection = document.querySelector('[data-section="terminal"]')
        terminalSection?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 150)
    }
  }

  const handleServiceTypeSelect = (serviceType: "drop_off" | "pick_up") => {
    setSelectedServiceType(serviceType)
    setSelectedScheduleId(null)
    setSelectedDate("")
    setSelectedTerminalCode(null)
    setSelectedMeetingPointId(null)
    setRoomNumber("")
    setFlightNumber("")

    setTimeout(() => {
      const scheduleSection = document.querySelector('[data-section="schedule"]')
      scheduleSection?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 150)
  }

  const handleTerminalSelect = (terminalCode: string, meetingPointId: string) => {
    if (selectedServiceType === "drop_off" && terminalCode === "" && meetingPointId === "") {
      setSelectedTerminalCode(null)
      setSelectedMeetingPointId(null)
      setPricingTerminalCode(undefined)
    } else {
      setSelectedTerminalCode(terminalCode)
      setSelectedMeetingPointId(meetingPointId)
      setPricingTerminalCode(terminalCode)
    }
  }

  const isStep1Complete = Boolean(
    selectedServiceType &&
    selectedScheduleId &&
    (selectedServiceType === "drop_off" || selectedTerminalCode)
  )

  const handlePassengerCountChange = (count: number) => {
    setPassengerCount(count)
    setPricingPassengerCount(count)
  }

  const handleSurfboardChange = (has: boolean, count: number) => {
    setSurfboardCount(count)
    setPricingSurfboardCount(count)
  }

  const handleRoomNumberChange = (value: string) => setRoomNumber(value)
  const handleFlightNumberChange = (value: string) => setFlightNumber(value)
  const handleCustomerNameChange = (value: string) => setCustomerName(value)

  const getFormCompletionPercentage = () => {
    let completed = 0
    let total = 3
    if (customerName.trim()) completed++
    if (phoneNumber.trim()) completed++
    if (passengerCount > 0) completed++
    if (selectedServiceType === "drop_off") {
      total += 1
      if (roomNumber.trim()) completed++
    } else if (selectedServiceType === "pick_up") {
      total += 1
      if (flightNumber.trim()) completed++
    }
    return Math.min(100, (completed / total) * 100)
  }

  const isFormValid = Boolean(
    selectedScheduleId &&
    selectedDate &&
    selectedServiceType &&
    passengerCount >= 1 &&
    idempotencyKey &&
    customerName.trim() &&
    (selectedServiceType === "drop_off" ? roomNumber.trim() : flightNumber.trim()) &&
    (selectedServiceType === "drop_off" || (selectedTerminalCode && selectedMeetingPointId))
  )

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const { storePendingBooking } = await import("@/lib/booking-recovery")
    storePendingBooking(idempotencyKey, new Date().getTime())

    try {
      const { createBookingOptimistic } = await import("@/app/actions/booking")
      const result = await Promise.race([
        createBookingOptimistic(formData),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 30000))
      ]) as { success: boolean; bookingCode?: string; error?: string }

      if (result.success && result.bookingCode) {
        (await import("@/lib/booking-recovery")).clearPendingBooking()
        startTransition(() => router.push(`/booking/confirmation?code=${result.bookingCode}`))
      } else {
        handleBookingError(result.error || "Booking failed")
      }
    } catch (err: any) {
      handleBookingError(err?.message || "Booking failed")
    }
  }

  function handleBookingError(errorMessage: string) {
    (import("@/lib/booking-recovery")).then(({ clearPendingBooking }) => clearPendingBooking())
    let displayError = errorMessage
    if (errorMessage.includes('Kapasitas')) displayError = '❌ Sorry, the shuttle is fully booked. Please choose another time.'
    else if (errorMessage.includes('timeout')) displayError = '⏱️ Request timed out. Please try again.'
    setError(displayError)
    setIsSubmitting(false)
  }

  return (
    <PublicShell showBack backHref="/" hideCta>
      <BookingRecovery />
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* HOTEL HEADER CARD */}
        <Card className="overflow-hidden border border-slate-100 shadow-md rounded-2xl">
          <div className="relative h-44 sm:h-56">
            {currentHotel?.main && <Image src={currentHotel.main} alt={hotelName} fill priority className="object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/90 rounded-2xl p-2 shadow-md shrink-0">
                  <Image src={currentHotel.logo} alt={`${hotelShortName} logo`} width={50} height={50} className="object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-white/70">Airport Shuttle Service</p>
                  <h2 className="text-lg sm:text-2xl font-bold leading-tight">{hotelName}</h2>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-white/90 font-medium">
                <BadgeInfo icon={<Clock className="h-3.5 w-3.5" />} label="06:00 - 22:00" />
                <BadgeInfo icon={<Shield className="h-3.5 w-3.5 text-emerald-400" />} label="Free for hotel guests" />
              </div>
            </div>
          </div>
        </Card>

        {/* STEP WIZARD TABS */}
        <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={() => setBookingStep(1)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
              bookingStep === 1
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/15 scale-[1.01]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
              bookingStep === 1 ? "bg-emerald-400 text-slate-950" : "bg-slate-200 text-slate-700"
            }`}>1</span>
            <span>Choose Schedule & Route</span>
          </button>

          <button
            type="button"
            onClick={() => isStep1Complete && setBookingStep(2)}
            disabled={!isStep1Complete}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
              bookingStep === 2
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/15 scale-[1.01]"
                : isStep1Complete
                ? "text-slate-700 hover:text-slate-900 hover:bg-white/60 cursor-pointer"
                : "text-slate-400 cursor-not-allowed opacity-60"
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
              bookingStep === 2 ? "bg-emerald-400 text-slate-950" : "bg-slate-200 text-slate-700"
            }`}>2</span>
            <span>Passenger Details</span>
          </button>
        </div>

        {/* STEP 1: SELECT SERVICE & SCHEDULE */}
        {bookingStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <ServiceTypeSelector
              selectedServiceType={selectedServiceType}
              onServiceTypeSelect={handleServiceTypeSelect}
            />

            <div data-section="schedule">
              <ScheduleSelector
                todaySchedules={todaySchedules}
                tomorrowSchedules={tomorrowSchedules}
                selectedScheduleId={selectedScheduleId}
                onScheduleSelect={handleScheduleSelect}
                loading={loading}
                serviceType={selectedServiceType}
              />
            </div>

            {selectedServiceType === "pick_up" && selectedScheduleId && (
              <div data-section="terminal">
                <TerminalSelector
                  terminalMeetingPoints={terminalMeetingPoints}
                  selectedTerminalCode={selectedTerminalCode}
                  selectedMeetingPointId={selectedMeetingPointId}
                  onTerminalSelect={handleTerminalSelect}
                  loading={terminalLoading}
                  serviceType={selectedServiceType}
                  isOptional={false}
                />
              </div>
            )}

            {/* ACTION BUTTON TO PROCEED TO STEP 2 */}
            <div className="pt-2">
              <Button
                type="button"
                className="w-full h-13 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                disabled={!isStep1Complete}
                onClick={() => setBookingStep(2)}
              >
                {isStep1Complete
                  ? "Continue to Passenger Details ➔"
                  : !selectedServiceType
                  ? "Select travel direction first"
                  : !selectedScheduleId
                  ? "Select departure time"
                  : "Select arrival terminal"
                }
              </Button>
            </div>

            <Card className="border border-slate-200 shadow-sm rounded-2xl bg-slate-50/50">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Important Notes
                </h3>
                <ol className="list-decimal list-outside pl-4 space-y-1.5 text-xs text-slate-600 leading-relaxed marker:text-slate-400 marker:font-medium">
                  <li>Airport Shuttle (Drop-off/Pick-up) <strong>ONLY for registered hotel guests</strong>.</li>
                  <li>Seats are limited for each departure schedule.</li>
                  <li><strong>Surfboard charge:</strong> IDR 75.000,-nett/surfboard/way.</li>
                  <li><strong>Premium pick-up at terminal 3</strong> (Curbside area gate 5) additional IDR 150.000,-nett/car/way.</li>
                  <li>Please complete booking minimum <strong>20 minutes prior to departure</strong>.</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 2: PASSENGER FORM & CONFIRMATION */}
        {bookingStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* SELECTION SUMMARY HEADER */}
            <SelectionSummary
              serviceType={selectedServiceType}
              scheduleId={selectedScheduleId}
              terminalCode={selectedTerminalCode}
              date={selectedDate}
              todaySchedules={todaySchedules}
              tomorrowSchedules={tomorrowSchedules}
              onChangeSchedule={() => setBookingStep(1)}
              hotelName={hotelName}
              meetingPointId={selectedMeetingPointId}
              terminalMeetingPoints={terminalMeetingPoints}
            />

            <Card className="shadow-lg border border-slate-100 rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl text-slate-900">
                  <User className="h-6 w-6 text-primary" />
                  Passenger Details
                </CardTitle>
                <p className="text-xs text-slate-600">Download your digital ticket immediately after confirmation.</p>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>Form Progress</span>
                    <span className="font-semibold text-slate-800">{Math.round(getFormCompletionPercentage())}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${getFormCompletionPercentage()}%` }}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="hidden" name="scheduleId" value={selectedScheduleId || ""} />
                  <input type="hidden" name="bookingDate" value={selectedDate} />
                  <input type="hidden" name="passengerCount" value={passengerCount} />
                  <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
                  <input type="hidden" name="serviceType" value={selectedServiceType || ""} />
                  {selectedTerminalCode && <input type="hidden" name="terminalCode" value={selectedTerminalCode} />}
                  {selectedMeetingPointId && <input type="hidden" name="meetingPointId" value={selectedMeetingPointId} />}

                  <input type="hidden" name="roomNumber" value={roomNumber} />
                  <input type="hidden" name="flightNumber" value={flightNumber} />
                  <input type="hidden" name="hasSurfboard" value={hasSurfboard ? "true" : "false"} />
                  <input type="hidden" name="surfboardCount" value={surfboardCount} />
                  <input type="hidden" name="excessBaggageCount" value={excessBaggageCount} />
                  <input type="hidden" name="surfboardCost" value={pricing?.surfboardCost || 0} />
                  <input type="hidden" name="baggageCost" value={pricing?.baggageCost || 0} />
                  <input type="hidden" name="totalCost" value={pricing?.totalCost || 0} />

                  <FormField label="Full Name">
                    <Input
                      id="customerName"
                      name="customerName"
                      required
                      placeholder="Enter full name as per ID"
                      className="h-10 rounded-xl text-sm"
                      value={customerName}
                      onChange={(e) => handleCustomerNameChange(e.target.value)}
                    />
                  </FormField>

                  <FormField label="Phone Number (WhatsApp)">
                    <div className="grid grid-cols-[130px_1fr] gap-2">
                      <Select
                        value={countryCode}
                        onValueChange={(val) => setCountryCode(val)}
                      >
                        <SelectTrigger className="h-10 rounded-xl px-2 text-xs font-semibold">
                          <SelectValue placeholder="+62" />
                        </SelectTrigger>
                        <SelectContent>
                          {countryOptions.map((country) => (
                            <SelectItem key={country.code} value={country.dial} className="text-xs">
                              +{country.dial} ({country.label})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <input type="hidden" name="countryCode" value={countryCode} />
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        placeholder="8123456789"
                        className="h-10 rounded-xl flex-1 text-sm"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </FormField>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Passengers">
                      <Select
                        value={passengerCount.toString()}
                        onValueChange={(v) => handlePassengerCountChange(Number(v))}
                      >
                        <SelectTrigger className="h-10 rounded-xl text-sm">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={n.toString()}>{n} person{n > 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>

                  <ServiceSpecificFields
                    serviceType={selectedServiceType}
                    roomNumber={roomNumber}
                    flightNumber={flightNumber}
                    onRoomNumberChange={handleRoomNumberChange}
                    onFlightNumberChange={handleFlightNumberChange}
                  />

                  {config && (
                    <SurfboardSelector
                      hasSurfboard={hasSurfboard}
                      surfboardCount={surfboardCount}
                      onSurfboardChange={handleSurfboardChange}
                      pricing={{
                        costPerBoard: config.surfboardCostPerBoard,
                        currency: config.currency
                      }}
                    />
                  )}

                  {pricing && config && (
                    <PricingBreakdown
                      basePrice={0}
                      surfboardCost={pricing.surfboardCost}
                      baggageCost={pricing.baggageCost}
                      totalCost={pricing.totalCost}
                      currency={config.currency}
                      breakdown={pricing.breakdown}
                    />
                  )}

                  {error && (
                    <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3 shadow-md animate-in slide-in-from-top-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          <svg className="h-4 w-4 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
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

                  <div className="pt-4 space-y-3">
                    <Button
                      type="submit"
                      className={`w-full h-13 text-base font-semibold transition-all duration-300 rounded-xl shadow-md ${
                        isFormValid
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/20 hover:shadow-lg hover:scale-[1.01]"
                          : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-100 cursor-not-allowed"
                      }`}
                      disabled={!isFormValid || isSubmitting || isPending}
                    >
                      {isSubmitting || isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing booking...
                        </span>
                      ) : isFormValid ? (
                        `✓ Confirm ${selectedServiceType === "drop_off" ? "Drop-off" : "Pick-up"} Booking (Free)`
                      ) : (
                        <span className="flex items-center justify-center gap-2 text-sm text-slate-600">
                          {selectedServiceType === "drop_off" && !roomNumber.trim()
                            ? "Enter hotel room number to continue"
                            : selectedServiceType === "pick_up" && !flightNumber.trim()
                            ? "Enter flight number to continue"
                            : !customerName.trim()
                            ? "Enter full passenger name to continue"
                            : "Fill all required details"
                          }
                        </span>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 text-xs sm:text-sm font-semibold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                      onClick={() => setBookingStep(1)}
                    >
                      ← Back to Schedule Selection
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PublicShell>
  )
}

function SelectionSummary({
  serviceType,
  scheduleId,
  terminalCode,
  date,
  todaySchedules,
  tomorrowSchedules,
  onChangeSchedule,
  hotelName,
  meetingPointId,
  terminalMeetingPoints
}: {
  serviceType: string | null
  scheduleId: string | null
  terminalCode: string | null
  date: string
  todaySchedules: any[]
  tomorrowSchedules: any[]
  onChangeSchedule?: () => void
  hotelName: string
  meetingPointId: string | null
  terminalMeetingPoints: { id: string; terminalCode: string; locationDescription: string; arrivalTimeOffsetMin?: number; arrivalTimeOffsetMax?: number }[]
}) {
  const allSchedules = [...todaySchedules, ...tomorrowSchedules]
  const schedule = allSchedules.find(s => s.id === scheduleId)

  if (!scheduleId && !terminalCode) return null

  const isPickup = serviceType !== "drop_off"
  const pickupLabel = isPickup ? "Airport" : "Hotel"
  const dropoffLabel = isPickup ? "Hotel" : "Airport"

  // Resolve meeting point for pickup
  const meetingPoint = meetingPointId
    ? terminalMeetingPoints.find(mp => mp.id === meetingPointId)
    : terminalCode
      ? terminalMeetingPoints.find(mp => mp.terminalCode === terminalCode)
      : null

  const pickupLocation = isPickup
    ? (terminalCode ? `Terminal ${terminalCode}` : "Airport Terminal")
    : hotelName
  const pickupSub = isPickup
    ? (meetingPoint?.locationDescription || "Meeting point")
    : "Hotel Lobby"
  const dropoffLocation = isPickup
    ? hotelName
    : (terminalCode ? `Terminal ${terminalCode}` : "Airport")
  const dropoffSub = isPickup ? "Hotel drop-off" : "Terminal drop-off"
  const departureTime = schedule
    ? schedule.departure_time.split(':').slice(0, 2).join(':')
    : "--:--"
  const serviceDirection = isPickup
    ? "Airport shuttle · Pick-up service"
    : "Airport shuttle · Drop-off service"

  const mono = 'var(--font-mono-ibm, ui-monospace, monospace)'

  return (
    <div className="relative overflow-hidden" style={{ borderRadius: 16, background: 'var(--sp-paper)', boxShadow: '0 4px 24px rgba(24,34,49,0.10)' }}>
      {/* Status Row */}
      <div className="flex items-center justify-end" style={{ padding: '16px 20px 0' }}>
        <div className="flex items-center gap-1.5" style={{
          fontFamily: mono,
          fontSize: '10.5px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          padding: '5px 10px 5px 8px',
          borderRadius: '100px',
          background: 'var(--sp-transit-bg)',
          color: 'var(--sp-transit-dark)',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--sp-transit)',
            display: 'inline-block',
          }} />
          <span>Reserved</span>
        </div>
      </div>

      {/* Hotel name + service direction */}
      <div style={{ padding: '12px 20px 0' }}>
        <h2 style={{
          margin: 0,
          fontWeight: 700,
          fontSize: '20px',
          letterSpacing: '-0.01em',
          color: 'var(--sp-ink)',
        }}>{hotelName}</h2>
        <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--sp-ink-soft)' }}>
          {serviceDirection}
        </p>
      </div>

      {/* Route */}
      <div className="flex items-start justify-between" style={{ padding: '20px 20px 6px', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: mono,
            fontSize: '10px', letterSpacing: '0.1em',
            color: 'var(--sp-ink-faint)', textTransform: 'uppercase' as const,
            margin: '0 0 4px',
          }}>{pickupLabel}</p>
          <p style={{
            fontWeight: 600, fontSize: '14.5px', lineHeight: 1.25,
            margin: 0, color: 'var(--sp-ink)',
          }}>{pickupLocation}</p>
          <p style={{ fontSize: '11.5px', color: 'var(--sp-ink-soft)', margin: '2px 0 0' }}>
            {pickupSub}
          </p>
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
          <p style={{
            fontFamily: mono,
            fontSize: '10px', letterSpacing: '0.1em',
            color: 'var(--sp-ink-faint)', textTransform: 'uppercase' as const,
            margin: '0 0 4px',
          }}>{dropoffLabel}</p>
          <p style={{
            fontWeight: 600, fontSize: '14.5px', lineHeight: 1.25,
            margin: 0, color: 'var(--sp-ink)',
          }}>{dropoffLocation}</p>
          <p style={{ fontSize: '11.5px', color: 'var(--sp-ink-soft)', margin: '2px 0 0' }}>
            {dropoffSub}
          </p>
        </div>
      </div>

      {/* Track */}
      <div style={{ position: 'relative', height: 20, margin: '8px 20px 4px' }}>
        <div style={{ position: 'absolute', top: '50%', left: 6, right: 6, borderTop: '1.5px dashed var(--sp-ink-faint)', transform: 'translateY(-50%)' }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, width: 7, height: 7, borderRadius: '50%', background: 'var(--sp-transit)', transform: 'translateY(-50%)' }} />
        <div className="shuttle-pass-vehicle" style={{
          position: 'absolute', top: '50%', width: 16, height: 10, left: '6%', opacity: 0,
          transform: 'translate(-50%,-50%)',
        }}>
          <svg viewBox="0 0 24 14" fill="none" style={{ width: '100%', height: '100%', display: 'block' }}>
            <rect x="1" y="2" width="18" height="8" rx="2" fill="#182231" />
            <rect x="4" y="4" width="4" height="3.5" fill="#F4EDDD" />
            <rect x="9.5" y="4" width="4" height="3.5" fill="#F4EDDD" />
            <rect x="15" y="4" width="3" height="3.5" fill="#F4EDDD" />
            <circle cx="6" cy="11" r="2" fill="#182231" />
            <circle cx="15" cy="11" r="2" fill="#182231" />
          </svg>
        </div>
        <div style={{ position: 'absolute', top: '50%', right: 0, width: 7, height: 7, borderRadius: '50%', background: 'var(--sp-ink)', transform: 'translateY(-50%)' }} />
      </div>

      {/* Depart Row */}
      <div className="flex items-baseline justify-between" style={{ padding: '10px 20px 18px', borderBottom: '1px dashed var(--sp-line)' }}>
        <p style={{
          fontFamily: mono,
          fontSize: '19px', fontWeight: 600, letterSpacing: '0.01em',
          margin: 0, color: 'var(--sp-ink)',
        }}>
          {departureTime}
          <span style={{ fontSize: '11px', color: 'var(--sp-ink-faint)', fontWeight: 400, marginLeft: '4px' }}>WIB</span>
        </p>
        {date && (
          <p style={{
            fontFamily: mono,
            fontSize: '11.5px', color: 'var(--sp-ink-soft)', margin: 0,
          }}>
            {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Notches */}
      <div style={{ position: 'relative', height: 0 }}>
        <div style={{ position: 'absolute', top: -11, left: -11, width: 22, height: 22, borderRadius: '50%', background: '#f8fafc', zIndex: 2 }} />
        <div style={{ position: 'absolute', top: -11, right: -11, width: 22, height: 22, borderRadius: '50%', background: '#f8fafc', zIndex: 2 }} />
      </div>

      {/* Footer — Change action */}
      {onChangeSchedule && (
        <div className="flex items-center justify-center" style={{ padding: '14px 20px 14px' }}>
          <button
            type="button"
            onClick={onChangeSchedule}
            className="flex items-center gap-1.5 transition-colors"
            style={{
              fontFamily: mono,
              fontSize: '11px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              padding: '6px 16px',
              borderRadius: 8,
              border: '1px solid var(--sp-line)',
              background: 'transparent',
              color: 'var(--sp-ink-soft)',
              cursor: 'pointer',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            Change Route / Time
          </button>
        </div>
      )}
    </div>
  )
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-800">{label}</Label>
      {children}
    </div>
  )
}

function BadgeInfo({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20">
      {icon}
      {label}
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