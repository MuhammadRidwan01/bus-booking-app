"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { useSchedule, type ScheduleItem } from "./ScheduleContext"

export function ScheduleSection() {
    const { schedules, loading } = useSchedule()

    const { nextSchedule, currentTimeVal } = useMemo(() => {
        if (loading || schedules.length === 0) {
            return { nextSchedule: null, currentTimeVal: -1 }
        }

        const now = new Date()
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        const val = currentHour + (currentMinute / 60)

        const next = schedules.find(item => {
            const [hour, minute] = item.time.split(':').map(Number)
            const scheduleTimeVal = hour + (minute / 60)
            return scheduleTimeVal > val
        })

        return {
            nextSchedule: next || schedules[0],
            currentTimeVal: val
        }
    }, [schedules, loading])

    return (
        <section className="container mx-auto px-4 md:px-6 py-6 md:py-10">
            <div className="flex flex-col md:grid md:grid-cols-[240px_1fr] bg-white/90 backdrop-blur rounded-2xl border border-white/60 shadow-xl overflow-hidden ring-1 ring-black/5">
                {/* LEFT SIDE - TIMELINE */}
                <div className="bg-slate-50/80 p-6 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center">
                    <div className="flex md:block items-center justify-between md:space-y-8 relative">
                        {/* Vertical Line Desktop */}
                        <div className="hidden md:block absolute left-[9px] top-3 bottom-3 w-0.5 bg-slate-200"></div>
                        {/* Horizontal Line Mobile */}
                        <div className="md:hidden absolute top-[9px] left-3 right-3 h-0.5 bg-slate-200"></div>

                        <div className="relative pl-6 md:pl-8 z-10">
                            <div className="absolute left-0 top-1 md:top-1.5 h-2.5 w-2.5 rounded-full bg-slate-900 ring-4 ring-white" />
                            <p className="font-bold text-slate-900 leading-none text-sm md:text-base">Hotel Lobby</p>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Pick-up Point</p>
                        </div>
                        <div className="relative pl-6 md:pl-8 z-10 text-right md:text-left">
                            <div className="absolute right-0 top-1 md:left-0 md:top-1.5 h-2.5 w-2.5 rounded-full bg-slate-900 ring-4 ring-white" />
                            <p className="font-bold text-slate-900 leading-none text-sm md:text-base">Destination</p>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Drop-off Point</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - GRID */}
                <div className="p-5 md:p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-slate-900">Daily Departures</h3>
                            <Badge variant="outline" className="hidden sm:inline-flex bg-white text-slate-500 border-slate-200 font-normal">
                                WIB Timezone
                            </Badge>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase tracking-wide">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            Operating
                        </span>
                    </div>
                    {loading ? (
                        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 Gap-3 animate-pulse">
                            {[...Array(12)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-lg" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                            {schedules.map((item) => {
                                const [h, m] = item.time.split(':').map(Number)
                                const itemTimeVal = h + (m / 60)
                                const isPast = itemTimeVal < currentTimeVal && item !== nextSchedule

                                return (
                                    <div key={item.time} className={`
                                    flex flex-col items-center py-2 h-full justify-center rounded-lg border transition-colors cursor-default
                                    ${item === nextSchedule
                                            ? "bg-slate-900 text-white border-slate-900 shadow-md transform scale-105 z-10"
                                            : isPast
                                                ? "bg-slate-50 border-slate-100 text-slate-700" // PAST STYLE
                                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300" // FUTURE STYLE
                                        }
                                `}>
                                        <span className="text-sm font-bold">{item.time}</span>
                                        <span className={`text-[9px] w-full text-center leading-tight line-clamp-2 px-1 
                                        ${item === nextSchedule ? "text-slate-300" : isPast ? "text-slate-700" : "text-slate-500"}`}>
                                            {item.destination}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
