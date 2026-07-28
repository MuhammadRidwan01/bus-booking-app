"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users, Calendar, Check, AlertCircle } from "lucide-react"
import type { ScheduleWithCapacity } from "@/types"
import { formatTime } from "@/lib/utils"
import { addDays, format } from "date-fns"

interface ScheduleSelectorProps {
  todaySchedules: ScheduleWithCapacity[]
  tomorrowSchedules: ScheduleWithCapacity[]
  selectedScheduleId: string | null
  onScheduleSelect: (scheduleId: string, date: string) => void
  loading: boolean
  serviceType?: "drop_off" | "pick_up" | null
}

export function ScheduleSelector({
  todaySchedules,
  tomorrowSchedules,
  selectedScheduleId,
  onScheduleSelect,
  loading,
  serviceType,
}: ScheduleSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<"today" | "tomorrow">("today")

  const currentSchedules = useMemo(() => {
    const source = selectedDate === "today" ? todaySchedules : tomorrowSchedules

    const filtered = serviceType
      ? source.filter(schedule => schedule.service_type === serviceType)
      : source

    // Sort chronologically by departure time
    return filtered
      .slice()
      .sort((a, b) => {
        const aTime = a.departure_time.split(":").map(Number)
        const bTime = b.departure_time.split(":").map(Number)
        return aTime[0] * 60 + aTime[1] - (bTime[0] * 60 + bTime[1])
      })
  }, [selectedDate, todaySchedules, tomorrowSchedules, serviceType])

  const currentDateString = useMemo(() => {
    const base = new Date()
    if (selectedDate === "tomorrow") {
      return addDays(base, 1).toISOString().split("T")[0]
    }
    return base.toISOString().split("T")[0]
  }, [selectedDate])

  const todayLabel = useMemo(() => format(new Date(), "EEE, dd MMM"), [])
  const tomorrowLabel = useMemo(() => format(addDays(new Date(), 1), "EEE, dd MMM"), [])

  const selectedSchedule = useMemo(() => {
    return currentSchedules.find(s => s.id === selectedScheduleId)
  }, [currentSchedules, selectedScheduleId])

  // Helper to compute countdown hint: "Booking closes in 1h 2m"
  const getBookingCloseCountdown = (departureTimeStr: string, isPast?: boolean) => {
    if (isPast) return "Booking closed"

    const now = new Date()
    const [hours, minutes] = departureTimeStr.split(":").map(Number)
    
    // Construct target departure date
    const target = new Date()
    if (selectedDate === "tomorrow") {
      target.setDate(target.getDate() + 1)
    }
    target.setHours(hours, minutes, 0, 0)

    // Cutoff is 20 minutes before departure
    const cutoff = new Date(target.getTime() - 20 * 60 * 1000)
    const diffMs = cutoff.getTime() - now.getTime()

    if (diffMs <= 0) return "Booking closing soon"

    const totalMins = Math.floor(diffMs / (1000 * 60))
    const h = Math.floor(totalMins / 60)
    const m = totalMins % 60

    if (h > 0) {
      return `Booking closes in ${h}h ${m}m`
    }
    return `Booking closes in ${m}m`
  }

  if (!serviceType) {
    return (
      <Card className="border border-slate-200/80 shadow-sm bg-white rounded-2xl p-8 text-center">
        <div className="max-w-sm mx-auto space-y-2 py-4">
          <Clock className="h-8 w-8 mx-auto text-slate-300 stroke-[1.5]" />
          <h3 className="font-semibold text-slate-900 text-base">Pilih Arah Layanan</h3>
          <p className="text-xs text-slate-500 leading-relaxed">Pilih rute Drop-off atau Pick-up terlebih dahulu untuk melihat jadwal bus.</p>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="border border-slate-200/60 shadow-sm bg-white rounded-2xl p-6">
        <div className="h-6 w-36 bg-slate-100 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="border border-slate-200/80 shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PICK A SCHEDULE</p>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Nearest departures
            </CardTitle>
          </div>

          {/* DAY SEGMENTED CONTROL */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center self-start sm:self-auto text-xs font-medium">
            <button
              type="button"
              onClick={() => setSelectedDate("today")}
              disabled={todaySchedules.length === 0}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                selectedDate === "today"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              } ${todaySchedules.length === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              Today ({todayLabel})
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate("tomorrow")}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                selectedDate === "tomorrow"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tomorrow ({tomorrowLabel})
            </button>
          </div>
        </div>

        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 bg-blue-50/60 border border-blue-100 text-blue-800 p-2.5 rounded-xl">
          <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
          <span>
            {serviceType === "drop_off"
              ? "Hotel to Airport - Tickets can be booked up to 20 minutes before departure."
              : "Airport to Hotel - Tickets can be booked up to 20 minutes before departure."}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {currentSchedules.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Clock className="h-8 w-8 mx-auto mb-2 text-slate-400" />
            <p className="font-semibold text-slate-800 text-sm">No schedules available for this day.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentSchedules.map((schedule) => {
              const isSelected = selectedScheduleId === schedule.id
              const isPast = schedule.isPast
              const isFull = schedule.status === "full"
              const disabled = isPast || isFull
              const percentage = Math.round((schedule.current_booked / schedule.max_capacity) * 100)
              const countdownText = getBookingCloseCountdown(schedule.departure_time, isPast)

              const routeShortLabel = serviceType === "drop_off" ? "Hotel → Airport" : "Airport → Hotel"
              const routeDetailedLabel = serviceType === "drop_off"
                ? "Hotel Lobby → Soekarno-Hatta Airport"
                : "Soekarno-Hatta Airport → Hotel Lobby"

              return (
                <button
                  key={schedule.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onScheduleSelect(schedule.id, currentDateString)}
                  className={`relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 bg-white ${
                    isSelected
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10 shadow-md scale-[1.01]"
                      : disabled
                      ? "border-slate-100 bg-slate-50/60 opacity-60 cursor-not-allowed"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-sm cursor-pointer"
                  }`}
                >
                  {/* TOP ROW: TIME + ROUTE BADGE + STATUS */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center font-bold text-slate-900 text-base sm:text-lg">
                      <Clock className={`h-5 w-5 mr-2 ${isSelected ? "text-emerald-600" : "text-slate-700"}`} />
                      <span>{formatTime(schedule.departure_time)} <span className="text-xs font-normal text-slate-500">WIB</span></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-600 hidden sm:inline">{routeShortLabel}</span>
                      
                      <Badge
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isPast
                            ? "bg-slate-100 text-slate-500 border-slate-200"
                            : isFull
                            ? "bg-rose-50 text-rose-600 border-rose-200"
                            : "bg-emerald-50 text-emerald-600 border-emerald-200"
                        }`}
                      >
                        {isPast ? "Expired" : isFull ? "Full" : "Available"}
                      </Badge>
                    </div>
                  </div>

                  {/* SECOND ROW: LOCATION DETAIL */}
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-3">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">{routeDetailedLabel}</span>
                  </div>

                  {/* THIRD ROW: PASSENGERS RATIO + PERCENTAGE FILLED */}
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-slate-400" />
                      {schedule.current_booked}/{schedule.max_capacity} passengers
                    </span>
                    <span className="font-bold text-slate-800">{percentage}% filled</span>
                  </div>

                  {/* FOURTH ROW: PROGRESS BAR TRACK */}
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all duration-300 ${
                        percentage >= 90 ? "bg-rose-500" : percentage >= 70 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* FIFTH ROW: BOOKING CLOSES COUNTDOWN HINT */}
                  <div className="text-xs text-slate-500 font-normal pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span>{countdownText}</span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-xs">
                        <Check className="h-3.5 w-3.5 stroke-[3]" /> Selected
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
