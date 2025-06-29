"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import type { ScheduleWithCapacity } from "@/types"
import { formatTime } from "@/lib/utils"

interface ScheduleSelectorProps {
  todaySchedules: ScheduleWithCapacity[]
  tomorrowSchedules: ScheduleWithCapacity[]
  selectedScheduleId: string | null
  onScheduleSelect: (scheduleId: string, date: string) => void
  loading: boolean
  onReconnect?: () => void
  isConnected?: boolean
  channelStatus?: 'SUBSCRIBED' | 'CLOSED' | 'TIMED_OUT' | 'CHANNEL_ERROR' | null
}

export function ScheduleSelector({
  todaySchedules,
  tomorrowSchedules,
  selectedScheduleId,
  onScheduleSelect,
  loading,
  onReconnect,
  isConnected = true,
  channelStatus = 'SUBSCRIBED',
}: ScheduleSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<"today" | "tomorrow">("today")

  const currentSchedules = (selectedDate === "today" ? todaySchedules : tomorrowSchedules)
    .slice()
    .sort((a, b) => {
      // Prioritaskan yang masih bisa dipesan
      if (!!a.isPast !== !!b.isPast) {
        return a.isPast ? 1 : -1
      }
      // Urutkan berdasarkan jam keberangkatan
      const aTime = a.departure_time.split(":").map(Number)
      const bTime = b.departure_time.split(":").map(Number)
      return (aTime[0] * 60 + aTime[1]) - (bTime[0] * 60 + bTime[1])
    })
  const currentDateString =
    selectedDate === "today"
      ? new Date().toISOString().split("T")[0]
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const getCapacityColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 animate-pulse"
      case "almost-full":
        return "bg-yellow-100 text-yellow-800 animate-pulse"
      case "full":
        return "bg-red-100 text-red-800"
      case "expired":
        return "bg-red-500 text-gray-300"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCapacityText = (status: string) => {
    switch (status) {
      case "available":
        return "Tersedia"
      case "almost-full":
        return "Hampir Penuh"
      case "full":
        return "Penuh"
      case "expired":
        return "Tidak Tersedia"
      default:
        return "Tidak Tersedia"
    }
  }

  const getProgressColor = (current: number, max: number) => {
    const percentage = (current / max) * 100
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  if (loading) {
    return (
      <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
        <CardHeader>
          <CardTitle>Pilih Jadwal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Pilih Jadwal</CardTitle>

        <div className="mb-2 text-sm text-blue-700 bg-blue-100 rounded px-3 py-2">
          Tiket hanya bisa dipesan maksimal <b>20 menit sebelum keberangkatan</b>.
        </div>

        {/* Indikator koneksi realtime */}
        <div className="flex items-center gap-2 mb-2">
          {channelStatus === 'SUBSCRIBED' ? (
            <>
              <CheckCircle className="text-green-500 w-4 h-4" />
              <span className="text-green-700 text-xs">Realtime update aktif</span>
            </>
          ) : (
            <>
              <XCircle className="text-red-500 w-4 h-4" />
              <span className="text-red-700 text-xs">Terputus</span>
              <button
                className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded flex items-center gap-1 hover:bg-red-200"
                onClick={onReconnect}
                type="button"
              >
                <RefreshCw className="w-3 h-3 animate-spin mr-1" />{channelStatus}
              </button>
            </>
          )}
        </div>

        <div className="flex space-x-2 mt-4">
          <Button
            type="button"
            variant={selectedDate === "today" ? "default" : "outline"}
            size="lg"
            onClick={() => setSelectedDate("today")}
            disabled={todaySchedules.length === 0}
            className="flex-1 transition-all duration-300"
          >
            Hari Ini
            {todaySchedules.length === 0 && (
              <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded-full">(Tidak Ada)</span>
            )}
          </Button>
          <Button
            type="button"
            variant={selectedDate === "tomorrow" ? "default" : "outline"}
            size="lg"
            onClick={() => setSelectedDate("tomorrow")}
            className="flex-1 transition-all duration-300"
          >
            Besok
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {currentSchedules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300 animate-pulse" />
            <p className="text-lg font-semibold text-gray-700">
              Tidak ada jadwal tersedia untuk {selectedDate === "today" ? "hari ini" : "besok"}
            </p>
            {selectedDate === "today" && (
              <div className="flex items-center justify-center mt-3 text-yellow-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <p className="text-sm">Jadwal hari ini mungkin sudah lewat</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`border-2 rounded-xl p-5 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                  selectedScheduleId === schedule.id
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                } ${(schedule.status === "full" || schedule.isPast || schedule.status === "expired") ? "opacity-60 cursor-not-allowed bg-gray-100" : ""}`}
                onClick={() => {
                  if (schedule.status !== "full" && !schedule.isPast && schedule.status !== "expired") {
                    onScheduleSelect(schedule.id, currentDateString)
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xl font-bold">
                        <Clock className="h-6 w-6 mr-2 text-blue-600" />
                        {formatTime(schedule.departure_time)} WIB
                      </div>
                      <Badge className={`${getCapacityColor(schedule.status)} px-3 py-1 text-sm font-medium`}>
                        {getCapacityText(schedule.status)}
                      </Badge>
                    </div>

                    {/* Info waktu sebelum keberangkatan */}
                    <div className="text-xs text-gray-500 mt-1">
                      {(() => {
                        if (schedule.status === "expired" || schedule.isPast) {
                          return <span className="text-gray-500">Jadwal sudah lewat</span>
                        }

                        // Hitung berapa menit lagi sebelum keberangkatan
                        const now = new Date()
                        const scheduleDateTime = new Date(schedule.schedule_date)
                        const [hours, minutes] = schedule.departure_time.split(":")
                        const departureDateTime = new Date(scheduleDateTime)
                        departureDateTime.setHours(Number(hours), Number(minutes), 0, 0)
                        const diffMs = departureDateTime.getTime() - now.getTime()
                        const diffMinutes = Math.floor(diffMs / 60000)
                        
                        if (diffMinutes > 20) {
                          const availableMinutes = diffMinutes - 20
                          const jam = Math.floor(availableMinutes / 60)
                          const menit = availableMinutes % 60
                          return <span className="text-green-500">Ditutup dalam {jam > 0 ? `${jam} jam ` : ""}{menit > 0 ? `${menit} menit` : jam === 0 ? "0 menit" : ""}</span>
                        } else {
                          return <span className="text-red-500">Sudah tidak bisa dipesan</span>
                        }
                      })()}
                    </div>

                    <div className="flex items-center text-gray-700">
                      <MapPin className="h-5 w-5 mr-2 text-indigo-500" />
                      <span className="font-medium">{schedule.destination}</span>
                    </div>

                    {/* Only show capacity info for non-expired schedules */}
                    {schedule.status !== "expired" && !schedule.isPast && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            <span>
                              {schedule.current_booked}/{schedule.max_capacity} penumpang
                            </span>
                          </div>
                          <span className="text-xs">
                            {Math.round((schedule.current_booked / schedule.max_capacity) * 100)}% terisi
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressColor(
                              schedule.current_booked,
                              schedule.max_capacity
                            )} transition-all duration-500`}
                            style={{
                              width: `${(schedule.current_booked / schedule.max_capacity) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedScheduleId === schedule.id && (
                    <div className="ml-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-3 h-3 bg-white rounded-full" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
