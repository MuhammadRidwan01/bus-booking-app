"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users, AlertTriangle, CalendarRange } from "lucide-react"
import type { ScheduleWithCapacity } from "@/types"
import { formatTime } from "@/lib/utils"
import { addDays, format } from "date-fns"

interface ScheduleSelectorProps {
  todaySchedules: ScheduleWithCapacity[]
  tomorrowSchedules: ScheduleWithCapacity[]
  selectedScheduleId: string | null
  onScheduleSelect: (scheduleId: string, date: string) => void
  loading: boolean
}

export function ScheduleSelector({
  todaySchedules,
  tomorrowSchedules,
  selectedScheduleId,
  onScheduleSelect,
  loading,
}: ScheduleSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<"today" | "tomorrow">("today")

  const currentSchedules = useMemo(() => {
    const source = selectedDate === "today" ? todaySchedules : tomorrowSchedules
    return source
      .slice()
      .sort((a, b) => {
        if (!!a.isPast !== !!b.isPast) return a.isPast ? 1 : -1
        const aTime = a.departure_time.split(":").map(Number)
        const bTime = b.departure_time.split(":").map(Number)
        return aTime[0] * 60 + aTime[1] - (bTime[0] * 60 + bTime[1])
      })
  }, [selectedDate, todaySchedules, tomorrowSchedules])

  const currentDateString = useMemo(() => {
    const base = new Date()
    if (selectedDate === "tomorrow") {
      return addDays(base, 1).toISOString().split("T")[0]
    }
    return base.toISOString().split("T")[0]
  }, [selectedDate])

  const todayLabel = useMemo(() => format(new Date(), "EEE, dd MMM"), [])
  const tomorrowLabel = useMemo(() => format(addDays(new Date(), 1), "EEE, dd MMM"), [])

  const getCapacityColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100"
      case "almost-full":
        return "bg-amber-50 text-amber-700 border border-amber-100"
      case "full":
        return "bg-rose-50 text-rose-700 border border-rose-100"
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200"
    }
  }

  const getCapacityText = (status: string) => {
    switch (status) {
      case "available":
        return "Available"
      case "almost-full":
        return "Almost full"
      case "full":
        return "Full"
      default:
        return "Unavailable"
    }
  }

  const getProgressColor = (current: number, max: number) => {
    const percentage = (current / max) * 100
    if (percentage >= 90) return "bg-rose-500"
    if (percentage >= 70) return "bg-amber-500"
    return "bg-emerald-500"
  }

  if (loading) {
    return (
      <Card className="shadow-lg transition-all duration-300 hover:shadow-xl bg-white/90">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Pick a schedule</p>
            <CardTitle className="text-xl">Loading</CardTitle>
          </div>
          <CalendarRange className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg transition-all duration-300 hover:shadow-xl bg-white/90 border border-slate-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pick a schedule</p>
            <CardTitle className="text-2xl font-semibold text-slate-900">Nearest departures</CardTitle>
          </div>
          <CalendarRange className="h-6 w-6 text-primary" />
        </div>
        <div className="mt-3 text-sm text-blue-900 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
          Tickets can be booked up to <span className="font-semibold">20 minutes</span> before departure.
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button
            type="button"
            variant={selectedDate === "today" ? "default" : "outline"}
            size="lg"
            onClick={() => setSelectedDate("today")}
            disabled={todaySchedules.length === 0}
            className="w-full rounded-xl h-12 flex flex-col items-start gap-1"
          >
            <span className="flex items-center gap-2">
              Today
              {todaySchedules.length === 0 && <span className="text-xs text-muted-foreground">(none)</span>}
            </span>
            <span className="text-xs text-muted-foreground">{todayLabel}</span>
          </Button>
          <Button
            type="button"
            variant={selectedDate === "tomorrow" ? "default" : "outline"}
            size="lg"
            onClick={() => setSelectedDate("tomorrow")}
            className="w-full rounded-xl h-12 flex flex-col items-start gap-1"
          >
            <span>Tomorrow</span>
            <span className="text-xs text-muted-foreground">{tomorrowLabel}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {currentSchedules.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Clock className="h-10 w-10 mx-auto mb-3 text-slate-400" />
            <p className="font-semibold text-slate-800">
              No schedules for {selectedDate === "today" ? "today" : "tomorrow"}
            </p>
            {selectedDate === "today" && (
              <div className="flex items-center justify-center mt-2 text-amber-700 text-sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Today’s schedules may be closed
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {currentSchedules.map((schedule) => {
              const percentage = Math.round((schedule.current_booked / schedule.max_capacity) * 100)
              const disabled = schedule.status === "full" || schedule.isPast

              return (
                <button
                  key={schedule.id}
                  type="button"
                  className={`w-full text-left rounded-2xl border transition-all duration-200 p-4 bg-white/70 hover:shadow-md hover:-translate-y-[1px] ${
                    selectedScheduleId === schedule.id ? "border-primary ring-2 ring-primary/10" : "border-slate-200"
                  } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  onClick={() => {
                    if (!disabled) onScheduleSelect(schedule.id, currentDateString)
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center text-lg font-semibold text-slate-900">
                          <Clock className="h-5 w-5 mr-2 text-primary" />
                          {formatTime(schedule.departure_time)} WIB
                        </div>
                        <Badge className={`${getCapacityColor(schedule.status)} px-3 py-1 text-xs font-semibold`}>
                          {getCapacityText(schedule.status)}
                        </Badge>
                      </div>

                      <div className="flex items-center text-sm text-slate-700">
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        <span className="font-medium">{schedule.destination}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-500" />
                          {schedule.current_booked}/{schedule.max_capacity} passengers
                        </span>
                        <span className="font-semibold text-slate-800">{percentage}% filled</span>
                      </div>

                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(schedule.current_booked, schedule.max_capacity)} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <p className="text-xs text-slate-500">
                        {(() => {
                          const now = new Date()
                          const scheduleDateTime = new Date(schedule.schedule_date)
                          const [hours, minutes] = schedule.departure_time.split(":")
                          const departureDateTime = new Date(scheduleDateTime)
                          departureDateTime.setHours(Number(hours), Number(minutes), 0, 0)
                          const diffMs = departureDateTime.getTime() - now.getTime()
                          const diffMinutes = Math.floor(diffMs / 60000)
                          if (schedule.isPast) return "No longer bookable"
                          if (diffMinutes > 20) {
                            const availableMinutes = diffMinutes - 20
                            const hours = Math.floor(availableMinutes / 60)
                            const minutes = availableMinutes % 60
                            const hoursText = hours > 0 ? `${hours}h ` : ""
                            const minutesText = `${minutes}m`
                            return `Booking closes in ${hoursText}${minutesText}`
                          }
                          return "Less than 20 minutes — closed"
                        })()}
                      </p>
                    </div>

                    {selectedScheduleId === schedule.id && (
                      <div className="mt-1">
                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                        </div>
                      </div>
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
