"use client"

import { Bus, Plane, ChevronRight, ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { MockSchedule } from "../page"
import { ScrollArea } from "@/components/ui/scroll-area"

interface OptionCSplitCardsProps {
    schedules: MockSchedule[]
}

export function OptionCSplitCards({ schedules }: OptionCSplitCardsProps) {
    const dropOffs = schedules.filter(s => s.service_type === "drop_off")
    const pickUps = schedules.filter(s => s.service_type === "pick_up")

    return (
        <div className="grid md:grid-cols-2 gap-6 h-[650px]">

            {/* CARD 1: DEPARTURES */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-indigo-50 border border-indigo-100 shadow-xl flex flex-col">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/50 rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2" />

                <div className="relative z-10 p-8 pb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-white p-3 rounded-2xl shadow-sm">
                            <Bus className="w-6 h-6 text-indigo-600" />
                        </div>
                        <Badge className="bg-white/50 hover:bg-white text-indigo-900 border-indigo-200 backdrop-blur-md">
                            {dropOffs.length} Schedules
                        </Badge>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Hotel Drop-off</h3>
                    <p className="text-slate-500 font-medium">Lobby <ArrowUpRight className="inline w-3 h-3 mb-1" /> Airport Terminals</p>
                </div>

                <div className="flex-1 overflow-hidden p-6 pt-0">
                    <div className="h-full bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/50 p-2 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-2">
                            {dropOffs.map(s => <ScheduleCard key={s.id} schedule={s} type="drop_off" />)}
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD 2: PICKUPS */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-emerald-50 border border-emerald-100 shadow-xl flex flex-col">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/50 rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2" />

                <div className="relative z-10 p-8 pb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-white p-3 rounded-2xl shadow-sm">
                            <Plane className="w-6 h-6 text-emerald-600 rotate-90" />
                        </div>
                        <Badge className="bg-white/50 hover:bg-white text-emerald-900 border-emerald-200 backdrop-blur-md">
                            {pickUps.length} Schedules
                        </Badge>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Airport Pick-up</h3>
                    <p className="text-slate-500 font-medium">Airport Points <ArrowUpRight className="inline w-3 h-3 mb-1" /> Hotel Lobby</p>
                </div>

                <div className="flex-1 overflow-hidden p-6 pt-0">
                    <div className="h-full bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/50 p-2 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-2">
                            {pickUps.map(s => <ScheduleCard key={s.id} schedule={s} type="pick_up" />)}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

function ScheduleCard({ schedule, type }: { schedule: MockSchedule, type: "drop_off" | "pick_up" }) {
    const isFull = schedule.status === "full"

    return (
        <button
            disabled={isFull}
            className={cn(
                "w-full flex items-center justify-between p-4 rounded-3xl transition-all duration-300 group/card",
                isFull
                    ? "bg-slate-100 opacity-60 text-slate-400"
                    : "bg-white/70 hover:bg-white hover:shadow-lg hover:scale-[1.02]"
            )}
        >
            <div className="flex items-center gap-4">
                <span className={cn(
                    "font-bold text-lg",
                    isFull ? "text-slate-400" : "text-slate-800"
                )}>
                    {schedule.time}
                </span>
                <div className="flex flex-col items-start gap-1">
                    {!isFull && (
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                            type === "drop_off" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                        )}>
                            Available
                        </span>
                    )}
                    {isFull && <span className="text-[10px] uppercase font-bold text-red-400">Full Booked</span>}
                </div>
            </div>

            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                isFull ? "bg-slate-200 text-slate-400" : "bg-slate-100 text-slate-400 group-hover/card:bg-slate-900 group-hover/card:text-white"
            )}>
                <ChevronRight className="w-4 h-4" />
            </div>
        </button>
    )
}
