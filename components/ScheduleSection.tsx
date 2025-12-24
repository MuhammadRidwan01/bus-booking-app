"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { useSchedule, type ScheduleItem } from "./ScheduleContext"
import { motion } from "framer-motion"
import { Bus, Plane, Clock, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function ScheduleSection() {
    const { schedules, loading } = useSchedule()

    const { dropOffs, pickUps, nextSchedule, currentTimeVal } = useMemo(() => {
        const now = new Date()
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        const val = currentHour + (currentMinute / 60)

        const dSchedules = schedules.filter(s => s.type === "drop_off")
        const pSchedules = schedules.filter(s => s.type === "pick_up")

        // Find overall next schedule for highlighting if needed, 
        // but it's better to find per-service.
        // For simplicity, let's keep the logic consistent with original.
        const findNext = (list: ScheduleItem[]) => {
            return list.find(item => {
                const [hour, minute] = item.time.split(':').map(Number)
                const scheduleTimeVal = hour + (minute / 60)
                return scheduleTimeVal > val
            }) || list[0]
        }

        return {
            dropOffs: dSchedules,
            pickUps: pSchedules,
            nextSchedule: findNext(schedules),
            currentTimeVal: val
        }
    }, [schedules])

    if (loading) {
        return (
            <section className="container mx-auto px-4 md:px-6 py-12">
                <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
            </section>
        )
    }

    return (
        <section className="container mx-auto px-4 md:px-6 py-12 md:py-20">
            {/* Header Section */}
            <div className="max-w-3xl mx-auto text-center mb-12 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                    <Clock className="w-3.5 h-3.5" />
                    Real-time Schedule
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
                    Shuttle <span className="text-primary italic">Narrative</span>
                </h2>
                <p className="text-slate-500 text-lg max-w-xl mx-auto">
                    A visual representation of today's shuttle journey across all terminals.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 max-w-6xl mx-auto relative px-4 sm:px-8">
                {/* Decorative Background Element */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gradient-to-br from-blue-100/20 via-primary/5 to-emerald-100/20 blur-[100px] -z-10 pointer-events-none" />

                {/* DEPARTURES COLUMN */}
                <TimelineGroup
                    title="Departures"
                    subtitle="Hotel Lobby → Airport"
                    items={dropOffs}
                    type="drop_off"
                    currentTimeVal={currentTimeVal}
                    nextSchedule={nextSchedule}
                />

                {/* PICKUPS COLUMN */}
                <TimelineGroup
                    title="Pick-ups"
                    subtitle="Airport Points → Hotel"
                    items={pickUps}
                    type="pick_up"
                    currentTimeVal={currentTimeVal}
                    nextSchedule={nextSchedule}
                />
            </div>

            <div className="mt-16 max-w-3xl mx-auto">
                <div className="bg-white/50 backdrop-blur-md border border-slate-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                        <Info className="w-6 h-6" />
                    </div>
                    <div className="text-center md:text-left">
                        <h4 className="font-bold text-slate-900">Note on Punctuality</h4>
                        <p className="text-sm text-slate-600">Please arrive at least 10 minutes before departure. Departure times are subject to traffic conditions and operational requirements.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}

function TimelineGroup({ title, subtitle, items, type, currentTimeVal, nextSchedule }: any) {
    const isDropOff = type === "drop_off"

    return (
        <div className="relative">
            {/* Timeline Line */}
            <div className={cn(
                "absolute left-6 top-8 bottom-8 w-[2px]",
                isDropOff
                    ? "bg-gradient-to-b from-blue-200 via-blue-100 to-slate-50"
                    : "bg-gradient-to-b from-emerald-200 via-emerald-100 to-slate-50"
            )} />

            <div className="relative pl-16 mb-10">
                <div className={cn(
                    "absolute left-0 top-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg z-10",
                    isDropOff
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-200"
                        : "bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-200"
                )}>
                    {isDropOff ? <Bus className="w-5 h-5" /> : <Plane className="w-5 h-5 rotate-90" />}
                </div>
                <h3 className="text-xl font-bold text-slate-900 pt-1 tracking-tight">{title}</h3>
                <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
            </div>

            <div className="space-y-6">
                {items.map((item: any, i: number) => {
                    const [h, m] = item.time.split(':').map(Number)
                    const itemTimeVal = h + (m / 60)
                    const isNext = item === nextSchedule
                    const isPast = itemTimeVal < currentTimeVal && !isNext

                    return (
                        <motion.div
                            initial={{ opacity: 0, x: isDropOff ? -20 : 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            key={`${item.time}-${item.destination}`}
                            className="relative pl-16 group"
                        >
                            {/* Node on Line */}
                            <div className={cn(
                                "absolute left-[21px] top-4 w-3 h-3 rounded-full border-2 border-white shadow-md z-10 transition-all duration-300",
                                isPast ? "bg-slate-300" :
                                    isNext
                                        ? (isDropOff ? "bg-blue-600 scale-125 ring-4 ring-blue-100" : "bg-emerald-600 scale-125 ring-4 ring-emerald-100")
                                        : (isDropOff ? "bg-blue-400 group-hover:bg-blue-600" : "bg-emerald-400 group-hover:bg-emerald-100")
                            )} />

                            <div className={cn(
                                "relative bg-white/40 backdrop-blur-sm border rounded-2xl p-4 transition-all duration-300",
                                isNext
                                    ? (isDropOff ? "bg-white border-blue-200 shadow-xl shadow-blue-100/50 scale-[1.02]" : "bg-white border-emerald-200 shadow-xl shadow-emerald-100/50 scale-[1.02]")
                                    : "border-slate-100 hover:bg-white hover:shadow-lg hover:border-slate-200",
                                isPast && "opacity-40 grayscale-[0.5]"
                            )}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className={cn(
                                        "text-xl font-black tracking-tight",
                                        isNext ? "text-slate-900" : "text-slate-700"
                                    )}>
                                        {item.time}
                                    </span>
                                    {isNext && (
                                        <Badge className={cn(
                                            "text-[10px] uppercase font-bold tracking-widest",
                                            isDropOff ? "bg-blue-100 text-blue-700 hover:bg-blue-100" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                        )}>
                                            Next Service
                                        </Badge>
                                    )}
                                    {isPast && (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Departed
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                        <div className={cn("w-1 h-1 rounded-full", isDropOff ? "bg-blue-300" : "bg-emerald-300")} />
                                        <span className="truncate">{item.destination}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <span className="font-semibold uppercase truncate">{item.hotel}</span>
                                    </div>
                                </div>

                                {isNext && (
                                    <div className="mt-4 flex justify-end">
                                        <a href={`/booking/${item.hotelSlug || 'ibis-styles'}`}>
                                            <button className={cn(
                                                "px-3 py-1.5 rounded-lg text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-md transition-transform active:scale-95",
                                                isDropOff ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
                                            )}>
                                                Book This
                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            </button>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
