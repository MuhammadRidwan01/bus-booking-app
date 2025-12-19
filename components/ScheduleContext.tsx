"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"

export interface ScheduleItem {
    time: string
    destination: string
    hotel?: string
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

                // 1. Get Hotel "ibis-styles" (Reference Hotel)
                const { data: hotel, error: hotelError } = await supabase
                    .from("hotels")
                    .select("id")
                    .eq("slug", "ibis-styles")
                    .single()

                let query = supabase
                    .from("bus_schedules")
                    .select("departure_time, destination")
                    .order("departure_time")

                // If hotel found, filter by it. If not, fallback to all.
                if (hotel && !hotelError) {
                    query = query.eq("hotel_id", hotel.id)
                }

                const { data, error } = await query

                if (error) throw error

                if (data) {
                    // unique schedules based on time+destination
                    const uniqueSchedules = data.map(item => ({
                        time: item.departure_time.slice(0, 5),
                        destination: item.destination
                    }))

                    // Simple deduplication if needed, though time+dest usually unique per hotel
                    setSchedules(uniqueSchedules)
                }
            } catch (err: any) {
                console.error("Error fetching schedules:", err)
                setError(err.message)
                // Fallback to static if DB fails
                setSchedules([
                    { time: "06:00", destination: "Soekarno-Hatta Airport" },
                    { time: "07:00", destination: "Soekarno-Hatta Airport" },
                    { time: "08:00", destination: "Soekarno-Hatta Airport" },
                    { time: "09:00", destination: "Grand Indonesia" },
                    { time: "10:00", destination: "Soekarno-Hatta Airport" },
                    { time: "12:00", destination: "Mall Taman Anggrek" },
                ])
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
