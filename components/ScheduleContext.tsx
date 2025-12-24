"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"

export interface ScheduleItem {
    id?: string
    time: string
    destination: string
    hotel?: string
    hotelSlug?: string
    type?: "drop_off" | "pick_up"
    currentBooked?: number
    maxCapacity?: number
    status?: string
}

interface ScheduleContextType {
    schedules: ScheduleItem[]
    loading: boolean
    error: string | null
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined)

export function ScheduleProvider({ children }: { children: ReactNode }) {
    const [schedules, setSchedules] = useState<ScheduleItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchSchedules() {
            try {
                setLoading(true)

                // Fetch all active schedules with hotel info and REAL-TIME capacity
                const today = new Date().toISOString().split('T')[0]
                const { data, error } = await supabase
                    .from("bus_schedules")
                    .select(`
                        id,
                        departure_time,
                        destination,
                        max_capacity,
                        hotel_id,
                        hotels (
                            id,
                            name,
                            slug
                        ),
                        daily_schedules (
                            current_booked,
                            status
                        )
                    `)
                    .eq('daily_schedules.schedule_date', today)
                    .order("departure_time")

                if (error) throw error

                if (data) {
                    const mappedSchedules = data.map((item: any) => {
                        const daily = item.daily_schedules?.[0] || { current_booked: 0, status: 'available' }
                        return {
                            id: item.id,
                            time: item.departure_time.slice(0, 5),
                            destination: item.destination,
                            hotel: item.hotels?.name || "Unknown Hotel",
                            hotelSlug: item.hotels?.slug,
                            type: (item.destination.toLowerCase().includes("ibis") || item.destination.toLowerCase().includes("hotel"))
                                ? "pick_up"
                                : "drop_off",
                            currentBooked: daily.current_booked || 0,
                            maxCapacity: item.max_capacity || 15,
                            status: daily.status || 'available'
                        }
                    })
                    setSchedules(mappedSchedules as ScheduleItem[])
                }
            } catch (err: any) {
                console.error("Error fetching schedules:", err)
                setError(err.message)
                // Fallback
                setSchedules([
                    { time: "06:00", destination: "Soekarno-Hatta Airport", hotel: "ibis Styles Jakarta Airport", hotelSlug: "booking/ibis-styles", type: "drop_off" },
                    { time: "07:00", destination: "Soekarno-Hatta Airport", hotel: "ibis Styles Jakarta Airport", hotelSlug: "booking/ibis-styles", type: "drop_off" },
                    { time: "08:00", destination: "Soekarno-Hatta Airport", hotel: "ibis Styles Jakarta Airport", hotelSlug: "booking/ibis-styles", type: "drop_off" },
                    { time: "09:00", destination: "Grand Indonesia", hotel: "ibis Styles Jakarta Airport", hotelSlug: "booking/ibis-styles", type: "pick_up" },
                    { time: "10:00", destination: "Soekarno-Hatta Airport", hotel: "ibis Budget Jakarta Airport", hotelSlug: "booking/ibis-budget", type: "drop_off" },
                    { time: "12:00", destination: "Mall Taman Anggrek", hotel: "ibis Budget Jakarta Airport", hotelSlug: "booking/ibis-budget", type: "pick_up" },
                ] as ScheduleItem[])
            } finally {
                setLoading(false)
            }
        }

        fetchSchedules()
    }, [])

    return (
        <ScheduleContext.Provider value={{ schedules, loading, error }}>
            {children}
        </ScheduleContext.Provider>
    )
}

export function useSchedule() {
    const context = useContext(ScheduleContext)
    if (context === undefined) {
        throw new Error("useSchedule must be used within a ScheduleProvider")
    }
    return context
}
