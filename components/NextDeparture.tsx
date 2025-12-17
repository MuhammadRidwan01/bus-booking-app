"use client"

import { Clock, MapPin } from "lucide-react"
import { useSchedule, type ScheduleItem } from "./ScheduleContext"
import { useEffect, useState } from "react"

export function NextDeparture() {
    const { schedules, loading } = useSchedule()
    const [nextBus, setNextBus] = useState<ScheduleItem | null>(null)

    useEffect(() => {
        if (loading || schedules.length === 0) return

        const now = new Date()
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        const currentTimeVal = currentHour + (currentMinute / 60)

        const next = schedules.find(item => {
            const [hour, minute] = item.time.split(':').map(Number)
            const scheduleTimeVal = hour + (minute / 60)
            return scheduleTimeVal > currentTimeVal
        })

        setNextBus(next || schedules[0])
    }, [schedules, loading])

    if (loading) {
        return (
            <div className="
        flex items-center gap-3 
        px-4 py-3 rounded-2xl
        border border-white/70 bg-white/90 backdrop-blur 
        shadow-sm text-sm text-slate-700 w-fit animate-pulse
      ">
                <div className="h-4 w-4 bg-slate-200 rounded-full" />
                <div className="space-y-1">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                    <div className="h-3 w-32 bg-slate-200 rounded" />
                </div>
            </div>
        )
    }

    return (
        <div className="
      flex items-center gap-3 
      px-4 py-3 rounded-2xl
      border border-white/70 bg-white/90 backdrop-blur 
      shadow-sm text-sm text-slate-700 w-fit
    ">
            <Clock className="h-4 w-4 text-primary" />
            <div className="leading-tight">
                <p className="font-semibold text-slate-900">
                    Next: <span className="text-primary">{nextBus?.time || "..."}</span>
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 max-w-[140px] truncate">
                    <MapPin className="h-3 w-3" />
                    To {nextBus?.destination || "checking..."}
                </div>
            </div>
        </div>
    )
}
