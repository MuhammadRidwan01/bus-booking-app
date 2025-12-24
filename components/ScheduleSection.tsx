"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { useSchedule, type ScheduleItem } from "./ScheduleContext"
import { motion, AnimatePresence } from "framer-motion"
import { Bus, Plane, Clock, Info, ArrowRight, Building2, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type HotelSlug = 'all' | 'ibis-styles' | 'ibis-budget'

export function ScheduleSection() {
    const { schedules, loading } = useSchedule()
    const [hotelFilter, setHotelFilter] = useState<HotelSlug>('all')
    const [showPastPickUps, setShowPastPickUps] = useState(false)
    const [showPastDropOffs, setShowPastDropOffs] = useState(false)

    // Current time for "Next Service" logic
    const { dropOffs, pickUps, nextDropOffs, nextPickUps, currentTimeVal } = useMemo(() => {
        const now = new Date()
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        const val = currentHour + (currentMinute / 60)

        // Filter by hotel selection
        const filteredSchedules = hotelFilter === 'all'
            ? schedules
            : schedules.filter(s => s.hotelSlug === hotelFilter)

        const dSchedules = filteredSchedules.filter(s => s.type === "drop_off")
        const pSchedules = filteredSchedules.filter(s => s.type === "pick_up")

        const findNextItems = (list: ScheduleItem[]) => {
            const styles = list.filter(s => s.hotelSlug === 'ibis-styles')
            const budget = list.filter(s => s.hotelSlug === 'ibis-budget')

            const getNextForOne = (sublist: ScheduleItem[]) => {
                const next = sublist.find(item => {
                    const [hour, minute] = item.time.split(':').map(Number)
                    const scheduleTimeVal = hour + (minute / 60)
                    return scheduleTimeVal > val
                })
                return next || sublist[0]
            }

            return {
                styles: getNextForOne(styles),
                budget: getNextForOne(budget)
            }
        }

        const nextDropOffs = findNextItems(dSchedules)
        const nextPickUps = findNextItems(pSchedules)

        return {
            dropOffs: dSchedules,
            pickUps: pSchedules,
            nextDropOffs,
            nextPickUps,
            currentTimeVal: val
        }
    }, [schedules, hotelFilter])

    if (loading) {
        return (
            <section className="container mx-auto px-4 py-12">
                <div className="h-64 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse" />
            </section>
        )
    }

    const filters: { label: string, value: HotelSlug, icon: any }[] = [
        { label: "All Hotels", value: "all", icon: LayoutGrid },
        { label: "Ibis Styles", value: "ibis-styles", icon: Building2 },
        { label: "Ibis Budget", value: "ibis-budget", icon: Building2 },
    ]

    return (
        <section className="container mx-auto px-4 py-12 md:py-24">
            {/* Header - Cleaned up */}
            <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] border border-slate-200/50">
                    <Clock className="w-3.5 h-3.5" />
                    Live Schedule
                </div>

                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                    Shuttle <span className="text-primary italic">Narrative</span>
                </h2>

                <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
                    View terminal transfers and departures in real-time.
                    Filter by hotel for specific schedules.
                </p>

                {/* Filter - Standardized Pill Style */}
                <div className="flex flex-wrap justify-center gap-2 mt-8">
                    <div className="inline-flex p-1 bg-slate-50 border border-slate-200/60 rounded-full shadow-sm">
                        {filters.map((f) => {
                            const Icon = f.icon
                            const isActive = hotelFilter === f.value
                            return (
                                <button
                                    key={f.value}
                                    onClick={() => setHotelFilter(f.value)}
                                    className={cn(
                                        "relative px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                                        isActive ? "text-white bg-slate-900 shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-white"
                                    )}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {f.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 max-w-6xl mx-auto relative px-4">
                {/* TIMELINE GROUPS */}
                <TimelineGroup
                    title="Arrivals & Pick-ups"
                    subtitle="Terminal → Hotel"
                    items={pickUps}
                    type="pick_up"
                    currentTimeVal={currentTimeVal}
                    nextItems={nextPickUps}
                    showPast={showPastPickUps}
                    setShowPast={setShowPastPickUps}
                />

                <TimelineGroup
                    title="Hotel Departures"
                    subtitle="Hotel → Terminal"
                    items={dropOffs}
                    type="drop_off"
                    currentTimeVal={currentTimeVal}
                    nextItems={nextDropOffs}
                    showPast={showPastDropOffs}
                    setShowPast={setShowPastDropOffs}
                />
            </div>

            {/* Note - Unified with app style */}
            <div className="mt-16 max-w-2xl mx-auto">
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                    <div className="p-2 bg-white rounded-lg border border-slate-200/60 text-primary shadow-sm shrink-0">
                        <Info className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-bold text-slate-900">Punctuality Note</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Please be at the meeting point 10 minutes before the scheduled time.
                            Shuttles operate strictly according to the published schedule.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

function TimelineGroup({ title, subtitle, items, currentTimeVal, nextItems, showPast, setShowPast }: any) {
    const { filteredItems, pastCount } = useMemo(() => {
        const past = items.filter((item: any) => {
            const [h, m] = item.time.split(':').map(Number)
            const itemTimeVal = h + (m / 60)
            const isNext = item === nextItems.styles || item === nextItems.budget
            return itemTimeVal < currentTimeVal && !isNext
        })

        return {
            filteredItems: showPast ? items : items.filter((item: any) => !past.includes(item)),
            pastCount: past.length
        }
    }, [items, currentTimeVal, nextItems, showPast])

    return (
        <div className="relative">
            {/* Thinner Timeline Line */}
            <div className="absolute left-6 top-6 bottom-6 w-[2px] bg-slate-100" />

            {/* Header Label */}
            <div className="relative pl-14 mb-8">
                <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-white border-4 border-slate-900 z-10" />
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5">{subtitle}</p>
            </div>

            {/* Past Toggle - Clean Label */}
            {pastCount > 0 && (
                <div className="pl-14 mb-6">
                    <button
                        onClick={() => setShowPast(!showPast)}
                        className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2"
                    >
                        {showPast ? "Hide arrived" : `See ${pastCount} earlier schedules`}
                        <div className={cn("w-1 h-1 rounded-full", showPast ? "bg-slate-900" : "bg-slate-200")} />
                    </button>
                </div>
            )}

            <div className="space-y-6">
                <AnimatePresence mode="popLayout" initial={false}>
                    {filteredItems.map((item: any) => {
                        const [h, m] = item.time.split(':').map(Number)
                        const itemTimeVal = h + (m / 60)
                        const isNext = item === nextItems.styles || item === nextItems.budget
                        const isPast = itemTimeVal < currentTimeVal && !isNext
                        const isBudget = item.hotelSlug?.includes('budget')

                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={`${item.time}-${item.destination}-${item.hotelSlug}`}
                                className="relative pl-14 group"
                            >
                                {/* Circle on Line */}
                                <div className={cn(
                                    "absolute left-[20px] top-6 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 transition-all duration-300",
                                    isPast ? "bg-slate-200" :
                                        isNext ? "bg-slate-900 ring-4 ring-slate-100 scale-125" : "bg-slate-300 group-hover:bg-slate-900"
                                )} />

                                <div className={cn(
                                    "relative bg-white border rounded-2xl p-5 transition-all duration-300",
                                    isNext ? "border-slate-900 shadow-xl shadow-slate-200/50" : "border-slate-100 hover:border-slate-300",
                                    isPast && "opacity-40 grayscale-[0.5]"
                                )}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-baseline gap-1">
                                            <span className={cn(
                                                "text-2xl font-bold tracking-tighter transition-colors",
                                                isNext ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900"
                                            )}>
                                                {item.time}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WIB</span>
                                        </div>

                                        <div className="flex flex-col items-end gap-1.5">
                                            {/* Hotel IDENTIFIER (User Core Request) */}
                                            <div className={cn(
                                                "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                                                isBudget ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                            )}>
                                                {isBudget ? "Ibis Budget" : "Ibis Styles"}
                                            </div>

                                            {isNext && (
                                                <span className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em]">
                                                    Next Shuttle
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", isBudget ? "bg-blue-400" : "bg-emerald-400")} />
                                                <span className="truncate">{item.destination}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-0.5 ml-3 font-medium uppercase tracking-wide truncate">
                                                {item.hotel}
                                            </div>
                                        </div>

                                        {isNext && (
                                            <a href={`/booking/${item.hotelSlug}`}>
                                                <Button
                                                    size="sm"
                                                    className="rounded-full shadow-sm text-[10px] h-8 font-bold uppercase tracking-widest flex items-center gap-2"
                                                >
                                                    Book
                                                    <ArrowRight className="w-3 h-3" />
                                                </Button>
                                            </a>
                                        )}
                                    </div>

                                    {/* Subtle occupancy indicator */}
                                    {isNext && (
                                        <div className="mt-4 pt-4 border-t border-slate-50">
                                            <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-1.5">
                                                <span>Capacity</span>
                                                <span className={cn(
                                                    "font-bold",
                                                    item.status === 'full' ? "text-rose-500" :
                                                        item.status === 'almost-full' ? "text-amber-500" : "text-primary"
                                                )}>
                                                    {item.status === 'full' ? 'Full' :
                                                        item.status === 'almost-full' ? 'Almost Full' : 'Available'}
                                                </span>
                                            </div>
                                            <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.round(((item.currentBooked || 0) / (item.maxCapacity || 15)) * 100)}%` }}
                                                    className={cn(
                                                        "h-full transition-all duration-1000",
                                                        item.status === 'full' ? "bg-rose-500" :
                                                            item.status === 'almost-full' ? "bg-amber-500" : "bg-slate-900"
                                                    )}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-1 text-[8px] font-medium text-slate-400 uppercase tracking-tighter">
                                                <span>{item.currentBooked || 0} / {item.maxCapacity || 15} Booked</span>
                                                <span>{Math.round(((item.currentBooked || 0) / (item.maxCapacity || 15)) * 100)}% Filled</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </div>
    )
}
