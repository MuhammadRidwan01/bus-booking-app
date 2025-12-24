
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bus, Plane, MapPin, Clock, ArrowRight, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { MockSchedule } from "../page"

interface OptionATabsProps {
    schedules: MockSchedule[]
}

export function OptionATabs({ schedules }: OptionATabsProps) {
    const [activeTab, setActiveTab] = useState<"drop_off" | "pick_up">("drop_off")

    const filteredSchedules = schedules.filter(s => s.service_type === activeTab)

    return (
        <div className="max-w-4xl mx-auto">
            {/* LUXURY PILL TABS */}
            <div className="flex justify-center mb-10">
                <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-white/50 shadow-xl ring-1 ring-black/5 flex relative">
                    {/* Animated Background Pill */}
                    <motion.div
                        className={cn("absolute top-1.5 bottom-1.5 rounded-full shadow-lg z-0",
                            activeTab === "drop_off" ? "bg-slate-900 left-1.5 w-[50%]" : "bg-slate-900 right-1.5 w-[calc(50%-6px)]"
                        )}
                        layoutId="activeTabBackground"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />

                    <button
                        onClick={() => setActiveTab("drop_off")}
                        className={cn(
                            "relative z-10 px-8 py-3 rounded-full text-sm font-medium transition-colors duration-200 flex items-center gap-2",
                            activeTab === "drop_off" ? "text-white" : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        <Bus className="w-4 h-4" />
                        Hotel Drop-off
                    </button>
                    <button
                        onClick={() => setActiveTab("pick_up")}
                        className={cn(
                            "relative z-10 px-8 py-3 rounded-full text-sm font-medium transition-colors duration-200 flex items-center gap-2",
                            activeTab === "pick_up" ? "text-white" : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        <Plane className="w-4 h-4 rotate-90" />
                        Airport Pick-up
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">
                            {activeTab === "drop_off" ? "Departures to Airport" : "Pick-ups from Airport"}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {activeTab === "drop_off" ? "From Hotel Lobby" : "To Hotel Lobby"}
                        </p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={activeTab + "-count"}
                        className="text-right"
                    >
                        <span className="text-3xl font-light text-slate-300">/</span>
                        <span className="text-3xl font-bold text-slate-900">{filteredSchedules.length}</span>
                        <span className="text-sm text-slate-400 font-medium ml-1">options</span>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredSchedules.map((schedule, i) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.05 }}
                                key={schedule.id}
                                className={cn(
                                    "group relative overflow-hidden bg-white/60 backdrop-blur-sm border border-white/60 rounded-[1.5rem] p-5 transition-all duration-300",
                                    schedule.status === "full" ? "opacity-60 grayscale-[0.5]" : "hover:bg-white/90 hover:shadow-xl hover:shadow-slate-200/50 hover:border-white hover:-translate-y-1 block cursor-pointer"
                                )}
                            >
                                {/* Decorative Gradient Blob */}
                                <div className={cn(
                                    "absolute -right-10 -top-10 w-24 h-24 rounded-full blur-[40px] opacity-0 group-hover:opacity-40 transition-opacity duration-500",
                                    activeTab === "drop_off" ? "bg-blue-400" : "bg-emerald-400"
                                )} />

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-sm">
                                            <Clock className={cn("w-5 h-5", activeTab === "drop_off" ? "text-blue-600" : "text-emerald-600")} />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-slate-900 tracking-tight">{schedule.time}</span>
                                            {schedule.status === "available" && (
                                                <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700 border-0 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5">Open</Badge>
                                            )}
                                            {schedule.status === "almost-full" && (
                                                <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-0 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5">Fast</Badge>
                                            )}
                                            {schedule.status === "full" && (
                                                <Badge variant="outline" className="ml-2 bg-slate-100 text-slate-500 border-0 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5">Full</Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-start gap-2 text-xs text-slate-500">
                                            <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400" />
                                            <span className="leading-snug">
                                                {activeTab === "drop_off" ? "Transit to: " : "Pickup from: "}
                                                <span className="font-semibold text-slate-700 block text-sm mt-0.5">{schedule.destination.split(' ')[0]}...</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Minimalist Progress */}
                                    <div className="mt-auto pt-4 border-t border-slate-100/50">
                                        <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1.5">
                                            <span>Availability</span>
                                            <span className={cn(
                                                schedule.status === "available" ? "text-emerald-600" :
                                                    schedule.status === "almost-full" ? "text-amber-600" : "text-slate-400"
                                            )}>{schedule.max_capacity - schedule.current_booked} seats left</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(schedule.current_booked / schedule.max_capacity) * 100}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={cn("h-full rounded-full",
                                                    schedule.status === "full" ? "bg-slate-300" :
                                                        activeTab === "drop_off" ? "bg-gradient-to-r from-blue-500 to-indigo-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

