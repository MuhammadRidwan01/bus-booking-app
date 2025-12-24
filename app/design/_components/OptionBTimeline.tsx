
"use client"

import { Bus, Plane, Clock, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { MockSchedule } from "../page"
import { motion } from "framer-motion"

interface OptionBTimelineProps {
    schedules: MockSchedule[]
}

export function OptionBTimeline({ schedules }: OptionBTimelineProps) {
    const dropOffs = schedules.filter(s => s.service_type === "drop_off")
    const pickUps = schedules.filter(s => s.service_type === "pick_up")

    return (
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">

            {/* TIMELINE LEFT: DEPARTURES */}
            <div className="relative">
                {/* Line Background */}
                <div className="absolute left-6 top-10 bottom-10 w-[2px] bg-gradient-to-b from-blue-100 via-blue-200 to-slate-100" />

                <div className="relative pl-16 mb-8">
                    <div className="absolute left-0 top-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Bus className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 pt-1">Departures</h3>
                    <p className="text-sm text-slate-500">Hotel Lobby → Airport</p>
                </div>

                <div className="space-y-6">
                    {dropOffs.map((schedule, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={schedule.id}
                            className="relative pl-16 group"
                        >
                            {/* Node on Line */}
                            <div className={cn(
                                "absolute left-[21px] top-4 w-3 h-3 rounded-full border-2 border-white shadow-md z-10 transition-colors duration-300",
                                schedule.status === "full" ? "bg-slate-300" : "bg-blue-500 group-hover:bg-blue-600 group-hover:scale-125"
                            )} />

                            <div className={cn(
                                "relative bg-white/50 backdrop-blur-sm border border-slate-100 rounded-2xl p-4 transition-all duration-300 hover:bg-white hover:shadow-lg hover:border-blue-200",
                                schedule.status === "full" ? "opacity-60" : "cursor-pointer"
                            )}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-bold text-slate-800">{schedule.time}</span>
                                    {schedule.status === "available" && (
                                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-0 font-bold uppercase tracking-wide">Open</Badge>
                                    )}
                                    {schedule.status === "full" && (
                                        <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-500 border-0 font-bold uppercase tracking-wide">Full</Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    <span>Transit to Airport Terminals</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* TIMELINE RIGHT: PICKUPS */}
            <div className="relative">
                {/* Line Background */}
                <div className="absolute left-6 top-10 bottom-10 w-[2px] bg-gradient-to-b from-emerald-100 via-emerald-200 to-slate-100" />

                <div className="relative pl-16 mb-8">
                    <div className="absolute left-0 top-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                        <Plane className="w-5 h-5 rotate-90" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 pt-1">Pick-ups</h3>
                    <p className="text-sm text-slate-500">Airport Points → Hotel</p>
                </div>

                <div className="space-y-6">
                    {pickUps.map((schedule, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={schedule.id}
                            className="relative pl-16 group"
                        >
                            {/* Node on Line */}
                            <div className={cn(
                                "absolute left-[21px] top-4 w-3 h-3 rounded-full border-2 border-white shadow-md z-10 transition-colors duration-300",
                                schedule.status === "full" ? "bg-slate-300" : "bg-emerald-500 group-hover:bg-emerald-600 group-hover:scale-125"
                            )} />

                            <div className={cn(
                                "relative bg-white/50 backdrop-blur-sm border border-slate-100 rounded-2xl p-4 transition-all duration-300 hover:bg-white hover:shadow-lg hover:border-emerald-200",
                                schedule.status === "full" ? "opacity-60" : "cursor-pointer"
                            )}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-bold text-slate-800">{schedule.time}</span>
                                    {schedule.status === "available" && (
                                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-0 font-bold uppercase tracking-wide">Open</Badge>
                                    )}
                                    {schedule.status === "full" && (
                                        <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-500 border-0 font-bold uppercase tracking-wide">Full</Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    <span>Direct Transfer to Hotel</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

        </div>
    )
}

