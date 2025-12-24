"use client"

import { useState } from "react"
import { OptionATabs } from "./_components/OptionATabs"
import { OptionBTimeline } from "./_components/OptionBTimeline"
import { OptionCSplitCards } from "./_components/OptionCSplitCards"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type MockSchedule = {
    id: string
    time: string
    destination: string
    service_type: "drop_off" | "pick_up"
    status: "available" | "almost-full" | "full"
    current_booked: number
    max_capacity: number
    isPast: boolean
}

const MOCK_SCHEDULES: MockSchedule[] = [
    // Drop-off (Hotel -> Airport)
    { id: "1", time: "04:15", destination: "Soekarno-Hatta International Airport", service_type: "drop_off", status: "available", current_booked: 2, max_capacity: 10, isPast: true },
    { id: "2", time: "06:00", destination: "Soekarno-Hatta International Airport", service_type: "drop_off", status: "almost-full", current_booked: 8, max_capacity: 10, isPast: false },
    { id: "3", time: "08:45", destination: "Soekarno-Hatta International Airport", service_type: "drop_off", status: "full", current_booked: 10, max_capacity: 10, isPast: false },
    { id: "4", time: "10:30", destination: "Soekarno-Hatta International Airport", service_type: "drop_off", status: "available", current_booked: 3, max_capacity: 10, isPast: false },
    { id: "5", time: "13:50", destination: "Soekarno-Hatta International Airport", service_type: "drop_off", status: "available", current_booked: 0, max_capacity: 10, isPast: false },
    { id: "6", time: "16:00", destination: "Soekarno-Hatta International Airport", service_type: "drop_off", status: "available", current_booked: 5, max_capacity: 10, isPast: false },

    // Pick-up (Airport -> Hotel)
    { id: "7", time: "07:30", destination: "Hotel Lobby", service_type: "pick_up", status: "available", current_booked: 1, max_capacity: 10, isPast: false },
    { id: "8", time: "09:00", destination: "Hotel Lobby", service_type: "pick_up", status: "available", current_booked: 4, max_capacity: 10, isPast: false },
    { id: "9", time: "12:00", destination: "Hotel Lobby", service_type: "pick_up", status: "full", current_booked: 10, max_capacity: 10, isPast: false },
    { id: "10", time: "15:30", destination: "Hotel Lobby", service_type: "pick_up", status: "almost-full", current_booked: 9, max_capacity: 10, isPast: false },
    { id: "11", time: "19:00", destination: "Hotel Lobby", service_type: "pick_up", status: "available", current_booked: 2, max_capacity: 10, isPast: false },
]

export default function DesignPage() {
    const [activeTab, setActiveTab] = useState<"A" | "B" | "C">("A")

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 relative isolate">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl opacity-60" />
            <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-3xl opacity-60" />
            <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[800px] h-[800px] bg-slate-50/80 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">

                {/* Header */}
                <div className="text-center space-y-4 pt-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">
                        Schedule <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Reimagined</span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        Choose the experience that fits your journey.
                    </p>
                </div>

                {/* Option Selectors */}
                <div className="flex justify-center">
                    <div className="inline-flex p-1.5 bg-white/60 backdrop-blur-md border border-white/40 rounded-full shadow-lg ring-1 ring-black/5">
                        {(["A", "B", "C"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300",
                                    activeTab === tab
                                        ? "bg-slate-900 text-white shadow-md transform scale-105"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                                )}
                            >
                                {tab === "A" && "Minimalist Tabs"}
                                {tab === "B" && "Journey Timeline"}
                                {tab === "C" && "Split View"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Display Area */}
                <div className="relative">
                    {/* Decorative blob behind container */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2.5rem] blur opacity-10 transition duration-1000 group-hover:opacity-20" />

                    <div className="relative bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-2xl overflow-hidden min-h-[600px]">
                        {/* Content Header */}
                        <div className="px-8 py-6 border-b border-white/30 bg-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                                    {activeTab === "A" && "Intuitive Separation"}
                                    {activeTab === "B" && "Visual Narrative"}
                                    {activeTab === "C" && "Comprehensive Overview"}
                                </h2>
                                <p className="text-sm text-slate-500 font-medium mt-1">
                                    {activeTab === "A" && "Reduces cognitive load by focusing on one direction."}
                                    {activeTab === "B" && "Illustrates the complete travel experience."}
                                    {activeTab === "C" && "Perfect for comparing all available options."}
                                </p>
                            </div>
                            {/* Status Dot */}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50/80 border border-emerald-100/50 rounded-full text-emerald-700 text-xs font-semibold shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Preview Mode
                            </div>
                        </div>

                        <div className="p-4 md:p-10">
                            <div className="max-w-5xl mx-auto">
                                {activeTab === "A" && <OptionATabs schedules={MOCK_SCHEDULES} />}
                                {activeTab === "B" && <OptionBTimeline schedules={MOCK_SCHEDULES} />}
                                {activeTab === "C" && <OptionCSplitCards schedules={MOCK_SCHEDULES} />}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
