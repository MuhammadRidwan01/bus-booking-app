"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users, AlertTriangle } from "lucide-react"
import type { ScheduleWithCapacity } from "@/types"
import { formatTime } from "@/lib/utils"

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

  const currentSchedules = selectedDate === "today" ? todaySchedules : tomorrowSchedules
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
                } ${schedule.status === "full" ? "opacity-60 cursor-not-allowed" : ""}`}
                onClick={() => {
                  if (schedule.status !== "full") {
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

                    <div className="flex items-center text-gray-700">
                      <MapPin className="h-5 w-5 mr-2 text-indigo-500" />
                      <span className="font-medium">{schedule.destination}</span>
                    </div>

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
