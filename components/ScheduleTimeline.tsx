"use client"

import { Bus, Plane, Clock, ArrowRight, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn, formatTime } from "@/lib/utils"
import { motion } from "framer-motion"
import type { ScheduleWithCapacity } from "@/types"

interface ScheduleTimelineProps {
    schedules: ScheduleWithCapacity[]
    serviceType: "drop_off" | "pick_up"
    onScheduleSelect: (scheduleId: string) => void
    selectedScheduleId: string | null
}

export function ScheduleTimeline({
    schedules,
    serviceType,
    onScheduleSelect,
    selectedScheduleId
}: ScheduleTimelineProps) {

    const isDropOff = serviceType === "drop_off"

    return (
        <div className="relative pl-4 sm:pl-10 max-w-2xl mx-auto py-6">
            {/* Line Background */}
            <div className={cn(
                "absolute left-4 sm:left-10 top-2 bottom-2 w-[2px]",
                isDropOff
                    ? "bg-gradient-to-b from-blue-100 via-blue-200 to-slate-50"
                    : "bg-gradient-to-b from-emerald-100 via-emerald-200 to-slate-50"
            )} />

            {/* Header Node */}
            <div className="relative pl-12 sm:pl-16 mb-10">
                <div className={cn(
                    "absolute left-0 top-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-lg z-10",
                    isDropOff
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-200"
                        : "bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-200"
                )}>
                    {isDropOff ? <Bus className="w-5 h-5" /> : <Plane className="w-5 h-5 rotate-90" />}
                </div>
                <h3 className="text-lg font-bold text-slate-900 pt-1 sm:pt-2">
                    {isDropOff ? "Departures" : "Pick-ups"}
                </h3>
                <p className="text-sm text-slate-500">
                    {isDropOff ? "Hotel Lobby → Airport" : "Airport Points → Hotel"}
                </p>
            </div>

            <div className="space-y-6">
                {schedules.map((schedule, i) => {
                    const isSelected = selectedScheduleId === schedule.id
                    const isFull = schedule.status === "full"
                    const isPast = schedule.isPast

                    return (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={schedule.id}
                            className="relative pl-12 sm:pl-16 group"
                        >
                            {/* Node on Line */}
                            <div className={cn(
                                "absolute left-[19px] sm:left-[21px] top-4 w-3 h-3 rounded-full border-2 border-white shadow-md z-10 transition-all duration-300",
                                (isFull || isPast) ? "bg-slate-300" :
                                    isSelected
                                        ? (isDropOff ? "bg-blue-600 scale-125 ring-4 ring-blue-100" : "bg-emerald-600 scale-125 ring-4 ring-emerald-100")
                                        : (isDropOff ? "bg-blue-400 group-hover:bg-blue-500" : "bg-emerald-400 group-hover:bg-emerald-500")
                            )} />

                            <button
                                onClick={() => !isFull && !isPast && onScheduleSelect(schedule.id)}
                                disabled={isFull || isPast}
                                className={cn(
                                    "w-full text-left relative bg-white border rounded-2xl p-4 transition-all duration-300",
                                    isSelected
                                        ? (isDropOff ? "border-blue-500 ring-1 ring-blue-500 shadow-md bg-blue-50/30" : "border-emerald-500 ring-1 ring-emerald-500 shadow-md bg-emerald-50/30")
                                        : "border-slate-100 hover:bg-white hover:shadow-lg hover:border-slate-200",
                                    (isFull || isPast) && "opacity-60 bg-slate-50 grayscale"
                                )}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xl font-bold text-slate-800 tracking-tight">
                                        {formatTime(schedule.departure_time)}
                                    </span>

                                    <div className="flex gap-2">
                                        {schedule.status === "available" && !isPast && (
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] border-0 font-bold uppercase tracking-wide",
                                                isDropOff ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                                            )}>
                                                Open
                                            </Badge>
                                        )}
                                        {schedule.status === "almost-full" && !isPast && (
                                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-0 font-bold uppercase tracking-wide">
                                                Fast
                                            </Badge>
                                        )}
                                        {isFull && (
                                            <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-500 border-0 font-bold uppercase tracking-wide">
                                                Full
                                            </Badge>
                                        )}
                                        {isPast && (
                                            <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-400 border-0 font-bold uppercase tracking-wide">
                                                Departed
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", isDropOff ? "bg-blue-300" : "bg-emerald-300")} />
                                    <span className="font-medium text-slate-600">
                                        {isDropOff ? `Transit to ${schedule.destination}` : `Direct to Hotel`}
                                    </span>
                                </div>

                                {/* Capacity Bar (Mini) */}
                                {!isPast && !isFull && (
                                    <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full", isDropOff ? "bg-blue-400" : "bg-emerald-400")}
                                            style={{ width: `${(schedule.current_booked / schedule.max_capacity) * 100}%` }}
                                        />
                                    </div>
                                )}
                            </button>
                        </motion.div>
                    )
                })}

                {schedules.length === 0 && (
                    <div className="pl-16 py-8 text-slate-400 italic text-sm">
                        No schedules available for this time.
                    </div>
                )}
            </div>
        </div>
    )
}
