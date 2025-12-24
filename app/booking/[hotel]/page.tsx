"use client"

import { useRef, useState, useTransition, useEffect, type ReactNode } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Shield, Clock, Loader2 } from "lucide-react"
import { ScheduleSelector } from "@/components/ScheduleSelector"
import { useRealTimeCapacity } from "@/hooks/useRealTimeCapacity"
import { ServiceTypeSelector } from "@/components/ServiceTypeSelector"
import { TerminalSelector } from "@/components/TerminalSelector"
import { useTerminalMeetingPoints } from "@/hooks/useTerminalMeetingPoints"
import { ServiceSpecificFields } from "@/components/ServiceSpecificFields"
import { SurfboardSelector } from "@/components/SurfboardSelector"
import { BaggageSelector } from "@/components/BaggageSelector"
import { PricingBreakdown } from "@/components/PricingBreakdown"
import { usePricingState } from "@/hooks/usePricing"
import Image from "next/image"
import { PublicShell } from "@/components/PublicShell"
import { BookingRecovery } from "@/components/BookingRecovery"

function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback UUID generator
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

  // Redirect legacy slug
  useEffect(() => {
    if (hotelSlug === "ibis-style") {
      router.replace("/booking/ibis-styles")
    }
  }, [hotelSlug, router])

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedServiceType, setSelectedServiceType] = useState<"drop_off" | "pick_up" | null>(null)
  const [selectedTerminalCode, setSelectedTerminalCode] = useState<string | null>(null)
  const [selectedMeetingPointId, setSelectedMeetingPointId] = useState<string | null>(null)
  const [passengerCount, setPassengerCount] = useState<number>(1)
  const [roomNumber, setRoomNumber] = useState<string>("")
  const [flightNumber, setFlightNumber] = useState<string>("")
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [hasWhatsapp, setHasWhatsapp] = useState<string>("yes")
  const [terminal, setTerminal] = useState<number>(1)
  const [surfboard, setSurfboard] = useState<string>("no")
  const [countryCode, setCountryCode] = useState<string>("62")
  const [customerName, setCustomerName] = useState<string>("")
  const [idempotencyKey] = useState(() => generateUUID())
  const formRef = useRef<HTMLDivElement | null>(null)

  const [isPending, startTransition] = useTransition()

  // Enhanced booking state with pricing
  const {
    surfboardCount,
    hasExcessBaggage,
    excessBaggageCount, // Keep for backward compatibility
    setSurfboardCount,
    setHasExcessBaggage,
    setExcessBaggageCount, // Keep for backward compatibility
    setTerminalCode: setPricingTerminalCode,
    setPassengerCount: setPricingPassengerCount,
    pricing,
    config,
    loading: pricingLoading,
    error: pricingError,
    hasSurfboard,
    totalCost,
    clearError: clearPricingError
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
    "ibis-styles": {
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
    
    // For pick-up service, scroll to terminal selection; for drop-off, scroll to form
    if (selectedServiceType === "pick_up") {
      setTimeout(() => {
        const terminalSection = document.querySelector('[data-section="terminal"]')
        terminalSection?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 150)
    } else {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150)
    }
  }

  const handleServiceTypeSelect = (serviceType: "drop_off" | "pick_up") => {
    setSelectedServiceType(serviceType)
    // Reset schedule and terminal selection when service type changes
    setSelectedScheduleId(null)
    setSelectedDate("")
    setSelectedTerminalCode(null)
    setSelectedMeetingPointId(null)
    // Reset service-specific fields
    setRoomNumber("")
    setFlightNumber("")
    
    // Scroll to schedule section
    setTimeout(() => {
      const scheduleSection = document.querySelector('[data-section="schedule"]')
      scheduleSection?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 150)
  }

  const handleTerminalSelect = (terminalCode: string, meetingPointId: string) => {
    // For drop-off service, allow empty values (skip terminal selection)
    if (selectedServiceType === "drop_off" && terminalCode === "" && meetingPointId === "") {
      setSelectedTerminalCode(null)
      setSelectedMeetingPointId(null)
      setPricingTerminalCode(undefined)
    } else {
      setSelectedTerminalCode(terminalCode)
      setSelectedMeetingPointId(meetingPointId)
      setPricingTerminalCode(terminalCode)
    }
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150)
  }

  // Sync passenger count with pricing state
  const handlePassengerCountChange = (count: number) => {
    setPassengerCount(count)
    setPricingPassengerCount(count)
  }

  // Handle surfboard selection
  const handleSurfboardChange = (has: boolean, count: number) => {
    setSurfboardCount(count)
  }

  // Handle baggage selection
  const handleExcessBaggageChange = (count: number) => {
    setExcessBaggageCount(count) // This will internally set hasExcessBaggage to count > 0
  }

  // Handle service-specific field changes
  const handleRoomNumberChange = (value: string) => {
    setRoomNumber(value)
  }

  const handleFlightNumberChange = (value: string) => {
    setFlightNumber(value)
  }

  const handleCustomerNameChange = (value: string) => {
    setCustomerName(value)
  }

  // Calculate form completion percentage for progress indicator
  const getFormCompletionPercentage = () => {
    let completed = 0
    let total = 0
    
    // Basic required fields
    total += 3 // customerName, phoneNumber, passengerCount
    if (customerName.trim()) completed++
    if (phoneNumber.trim()) completed++
    if (passengerCount > 0) completed++
    
    // Service-specific fields
    if (selectedServiceType === "drop_off") {
      total += 1 // roomNumber
      if (roomNumber.trim()) completed++
    } else if (selectedServiceType === "pick_up") {
      total += 1 // flightNumber  
      if (flightNumber.trim()) completed++
    }
    
    // Optional fields (count as bonus)
    if (hasSurfboard || hasExcessBaggage) {
      total += 1
      completed += 1 // Already configured
    }
    
    return Math.min(100, (completed / total) * 100)
  }

  const isFormValid = Boolean(
    selectedScheduleId && 
    selectedDate && 
    selectedServiceType &&
    passengerCount >= 1 && 
    idempotencyKey && 
    phoneNumber.trim() &&
    customerName.trim() &&
    // Service-specific field validation
    (selectedServiceType === "drop_off" ? roomNumber.trim() : flightNumber.trim()) &&
    // For pick-up service, terminal selection is required
    (selectedServiceType === "drop_off" || (selectedTerminalCode && selectedMeetingPointId))
  )

  // Auto-scroll to submit button when form becomes valid
  useEffect(() => {
    if (isFormValid && selectedScheduleId) {
      // Small delay to ensure form is rendered
      const timer = setTimeout(() => {
        const submitButton = document.querySelector('[data-submit-button]')
        if (submitButton) {
          submitButton.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
        }
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [isFormValid, selectedScheduleId])

  // Track if submit button is visible in viewport
  const [isSubmitButtonVisible, setIsSubmitButtonVisible] = useState(true)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSubmitButtonVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    const submitButton = document.querySelector('[data-submit-button]')
    if (submitButton) {
      observer.observe(submitButton)
    }

    return () => {
      if (submitButton) {
        observer.unobserve(submitButton)
      }
    }
  }, [selectedScheduleId])

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
    <PublicShell showBack backHref="/" hideCta>
      <BookingRecovery />
      <div className="space-y-6">

        {/* HOTEL HEADER CARD */}
        <Card className="overflow-hidden border border-slate-100 shadow-lg rounded-2xl">
          <div className="relative h-56 sm:h-64 md:h-72">
            {currentHotel?.main && (
              <Image src={currentHotel.main} alt={hotelName} fill priority className="object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/90 rounded-2xl p-2 shadow-md shrink-0">
                  <Image src={currentHotel.logo} alt={`${hotelShortName} logo`} width={60} height={60} className="object-contain" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="hidden sm:block text-xs uppercase tracking-[0.2em] text-white/70">Hotel pickup</p>
                  <h2 className="text-xl sm:text-3xl md:text-4xl font-semibold leading-tight">{hotelName}</h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs sm:text-sm text-white/90 font-medium">
                <BadgeInfo icon={<Clock className="h-3.5 w-3.5" />} label="06:00 - 22:00" />
                <BadgeInfo icon={<Shield className="h-3.5 w-3.5" />} label="Free for guests" />
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
            <StepPill active>1. Choose service</StepPill>
            <StepPill active={Boolean(selectedServiceType)}>2. Choose schedule</StepPill>
            {selectedServiceType === "pick_up" && (
              <StepPill active={Boolean(selectedTerminalCode)}>3. Choose terminal</StepPill>
            )}
            <StepPill active={Boolean(selectedScheduleId && (selectedServiceType === "drop_off" || selectedTerminalCode))}>
              {selectedServiceType === "pick_up" ? "4. Passenger details" : "3. Passenger details"}
            </StepPill>
          </div>

          {/* GRID — SERVICE TYPE + SCHEDULE + TERMINAL + FORM */}
          <div className="grid lg:grid-cols-[1.4fr,1fr] gap-6 items-start">

            {/* LEFT SIDE - SERVICE TYPE, SCHEDULE, AND TERMINAL SELECTION */}
            <div className="space-y-6 lg:order-1 order-1">
              {/* SERVICE TYPE SELECTION */}
              <ServiceTypeSelector
                selectedServiceType={selectedServiceType}
                onServiceTypeSelect={handleServiceTypeSelect}
              />

              {/* SCHEDULE SELECTION */}
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

              {/* TERMINAL SELECTION (only for pick-up service) */}
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

              {/* NEXT STEP GUIDANCE */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Next step</p>
                  <p className="text-xs text-slate-600">
                    {!selectedServiceType 
                      ? "Choose your travel direction first."
                      : !selectedScheduleId 
                      ? "Select a departure time."
                      : selectedServiceType === "pick_up" && !selectedTerminalCode
                      ? "Choose your arrival terminal."
                      : "Fill passenger details to complete booking."
                    }
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl lg:inline-flex hidden"
                  disabled={!selectedServiceType || !selectedScheduleId || (selectedServiceType === "pick_up" && !selectedTerminalCode)}
                  onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  {selectedServiceType === "pick_up" && !selectedTerminalCode ? "Select terminal first" : "Open passenger form"}
                </Button>
              </div>
            </div>

            {/* FORM SIDEBAR */}
            <div className="space-y-4 lg:order-2 order-2" ref={formRef} data-section="form">
              <Card className="shadow-lg border border-slate-100 rounded-2xl transition-all duration-300 hover:shadow-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xl md:text-2xl text-slate-900">
                    <User className="h-6 w-6 text-primary" />
                    Passenger Details
                  </CardTitle>
                  <p className="text-sm text-slate-600">Ticket is sent to WhatsApp after confirmation.</p>
                  
                  {/* Progress indicator */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>Form Progress</span>
                      <span className="font-medium">{Math.round(getFormCompletionPercentage())}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${getFormCompletionPercentage()}%` }}
                      />
                    </div>
                    {getFormCompletionPercentage() === 100 && (
                      <p className="text-xs text-green-600 mt-1 animate-pulse">✓ Ready to book!</p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="scheduleId" value={selectedScheduleId || ""} />
                    <input type="hidden" name="bookingDate" value={selectedDate} />
                    <input type="hidden" name="passengerCount" value={passengerCount} />
                    <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
                    <input type="hidden" name="serviceType" value={selectedServiceType || ""} />
                    {selectedTerminalCode && <input type="hidden" name="terminalCode" value={selectedTerminalCode} />}
                    {selectedMeetingPointId && <input type="hidden" name="meetingPointId" value={selectedMeetingPointId} />}
                    
                    {/* Enhanced booking fields */}
                    <input type="hidden" name="roomNumber" value={roomNumber} />
                    <input type="hidden" name="flightNumber" value={flightNumber} />
                    <input type="hidden" name="hasSurfboard" value={hasSurfboard ? "true" : "false"} />
                    <input type="hidden" name="surfboardCount" value={surfboardCount} />
                    <input type="hidden" name="excessBaggageCount" value={excessBaggageCount} />
                    <input type="hidden" name="surfboardCost" value={pricing?.surfboardCost || 0} />
                    <input type="hidden" name="baggageCost" value={pricing?.baggageCost || 0} />
                    <input type="hidden" name="totalCost" value={pricing?.totalCost || 0} />

                    {/* FORM — NAME */}
                    <FormField label="Full name">
                      <Input
                        id="customerName"
                        name="customerName"
                        required
                        placeholder="Full name as per ID"
                        className="h-10 rounded-xl"
                        value={customerName}
                        onChange={(e) => handleCustomerNameChange(e.target.value)}
                      />
                    </FormField>

                    {/* WHATSAPP */}
                    <FormField label="WhatsApp number">
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-slate-500">+</span>
                          <Input
                            name="countryCode"
                            type="tel"
                            className="h-10 rounded-xl px-2 text-sm"
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
                          className="h-10 rounded-xl flex-1"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>

                      <Select name="hasWhatsapp" value={hasWhatsapp} onValueChange={setHasWhatsapp}>
                        <SelectTrigger className="h-10 rounded-xl">
                          <SelectValue placeholder="WhatsApp active?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes, active</SelectItem>
                          <SelectItem value="no">No / not active</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    {/* PASSENGERS */}
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Passengers">
                        <Select
                          value={passengerCount.toString()}
                          onValueChange={(v) => handlePassengerCountChange(Number(v))}
                        >
                          <SelectTrigger className="h-10 rounded-xl">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <SelectItem key={n} value={n.toString()}>{n} person</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </div>

                    {/* SERVICE-SPECIFIC FIELDS */}
                    <ServiceSpecificFields
                      serviceType={selectedServiceType}
                      roomNumber={roomNumber}
                      flightNumber={flightNumber}
                      onRoomNumberChange={handleRoomNumberChange}
                      onFlightNumberChange={handleFlightNumberChange}
                    />

                    {/* SURFBOARD SELECTOR */}
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

                    {/* BAGGAGE SELECTOR */}
                    {config && (
                      <BaggageSelector
                        passengerCount={passengerCount}
                        excessBaggageCount={excessBaggageCount}
                        terminalCode={selectedTerminalCode || undefined}
                        onExcessBaggageChange={handleExcessBaggageChange}
                        pricing={{
                          freeItemsPerPassenger: config.baggageFreeItemsPerPassenger,
                          terminal3CurbsideCost: config.baggageTerminal3CurbsideCost,
                          otherTerminalsCost: config.baggageOtherTerminalsCost,
                          currency: config.currency
                        }}
                      />
                    )}

                    {/* PRICING BREAKDOWN */}
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

                    {/* TERMINAL SELECTION FOR DROP-OFF */}
                    {selectedServiceType === "drop_off" && (
                      <FormField label="Terminal (Optional)">
                        <Select 
                          value={selectedTerminalCode || "none"} 
                          onValueChange={(value) => {
                            if (value === "none") {
                              setSelectedTerminalCode(null)
                              setSelectedMeetingPointId(null)
                              setPricingTerminalCode(undefined)
                            } else {
                              const terminal = terminalMeetingPoints.find(t => t.terminalCode === value)
                              if (terminal) {
                                setSelectedTerminalCode(terminal.terminalCode)
                                setSelectedMeetingPointId(terminal.id)
                                setPricingTerminalCode(terminal.terminalCode)
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="h-10 rounded-xl">
                            <SelectValue placeholder="Select terminal (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No terminal specified</SelectItem>
                            {terminalMeetingPoints.map((terminal) => (
                              <SelectItem key={terminal.id} value={terminal.terminalCode}>
                                Terminal {terminal.terminalCode} ({terminal.terminalCode.includes('3') ? 'Domestic' : 'International'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>
                    )}

                    {/* ERRORS */}
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

                    {/* SUBMIT BUTTON - Normal positioning */}
                    <div className="pt-4 space-y-3">
                      {/* Quick summary */}
                      {pricing && pricing.totalCost > 0 && (
                        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-xl">
                          <p className="text-sm font-medium text-blue-900">
                            Total Cost: {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: config?.currency || 'IDR',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            }).format(pricing.totalCost)}
                          </p>
                        </div>
                      )}
                      
                      <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                        disabled={!isFormValid || isSubmitting || isPending}
                        data-submit-button
                      >
                        {isSubmitting || isPending 
                          ? "Processing..." 
                          : isFormValid 
                          ? `✓ Confirm ${selectedServiceType === "drop_off" ? "Drop-off" : "Pick-up"} Booking`
                          : "Complete booking details"
                        }
                      </Button>
                      
                      {!isFormValid && (
                        <div className="text-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                          {!selectedServiceType 
                            ? "Choose service type and schedule to continue."
                            : !selectedScheduleId
                            ? "Select a departure time to continue."
                            : selectedServiceType === "pick_up" && !selectedTerminalCode
                            ? "Select your arrival terminal to continue."
                            : selectedServiceType === "drop_off" && !roomNumber.trim()
                            ? "Enter your room number to continue."
                            : selectedServiceType === "pick_up" && !flightNumber.trim()
                            ? "Enter your flight number to continue."
                            : !customerName.trim()
                            ? "Enter your full name to continue."
                            : !phoneNumber.trim()
                            ? "Enter your WhatsApp number to continue."
                            : "Fill all required details to continue."
                          }
                        </div>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* INFO BOX */}
              <Card className="border border-slate-100 shadow-md rounded-2xl">
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Important info
                  </h3>
                  <ul className="space-y-1 text-xs text-slate-700">
                    <li>• Arrive at the lobby 10 minutes before departure.</li>
                    <li>• Show your WhatsApp ticket when boarding.</li>
                    <li>• Ensure flight number and passenger count are correct.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* FLOATING ACTION BUTTON - Shows when form is ready */}
        {selectedScheduleId && (selectedServiceType === "drop_off" || selectedTerminalCode) && (
          <div className="fixed bottom-6 right-6 z-50 lg:hidden">
            <Button
              type="button"
              size="lg"
              className="h-14 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full"
              onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            >
              <User className="h-5 w-5 mr-2" />
              Complete Booking
            </Button>
          </div>
        )}

        {/* Smart Floating Action Button - Only shows when submit button is not visible */}
        {selectedScheduleId && isFormValid && !isSubmitButtonVisible && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-2">
            <Button
              onClick={() => {
                const form = document.querySelector('form')
                if (form) {
                  form.requestSubmit()
                }
              }}
              className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={!isFormValid || isSubmitting || isPending}
            >
              {isPending ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </Button>
            
            {/* Tooltip */}
            <div className="absolute bottom-16 right-0 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
              Complete Booking
            </div>
          </div>
        )}

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
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${active ? "bg-primary/10 text-primary border-primary/20" : "bg-white text-slate-600 border-slate-200"
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