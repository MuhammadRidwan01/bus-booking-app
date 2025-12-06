"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { ScheduleWithCapacity } from "@/types"
import { getCapacityStatus, isScheduleAvailable } from "@/lib/utils"
import { format, addDays } from "date-fns"

export function useRealTimeCapacity(hotelSlug: string) {
  const [todaySchedules, setTodaySchedules] = useState<ScheduleWithCapacity[]>([])
  const [tomorrowSchedules, setTomorrowSchedules] = useState<ScheduleWithCapacity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd")
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd")
    console.log("Today:", today, "Tomorrow:", tomorrow)
    
    async function fetchSchedules() {
  try {
    setLoading(true)

    // Step 1: Get hotel ID dari slug
    const { data: hotel, error: hotelError } = await supabase
      .from("hotels")
      .select("id")
      .eq("slug", hotelSlug)
      .single()

    if (hotelError) {
      console.error("Error fetching hotel:", hotelError)
      return
    }
    if (!hotel) {
      console.warn("Hotel not found for slug:", hotelSlug)
      return
    }

    // Step 2: Ambil semua bus_schedules untuk hotel tersebut
    const { data: busSchedules, error: busError } = await supabase
      .from("bus_schedules")
      .select("id")
      .eq("hotel_id", hotel.id)

    if (busError) {
      console.error("Error fetching bus schedules:", busError)
      return
    }
    if (!busSchedules || busSchedules.length === 0) {
      console.warn("No bus schedules found for hotel id:", hotel.id)
      return
    }

    const busScheduleIds = busSchedules.map((b) => b.id)

    // Step 3: Ambil daily_schedules untuk today dan tomorrow dengan bus_schedule_id di busScheduleIds
    const fetchDailySchedules = async (date: string) => {
      const { data, error } = await supabase
        .from("daily_schedules")
        .select(`
          id,
          schedule_date,
          current_booked,
          status,
          bus_schedules (
            departure_time,
            destination,
            max_capacity
          )
        `)
        .eq("schedule_date", date)
        .in("bus_schedule_id", busScheduleIds)
        .eq("status", "active")

      if (error) {
        console.error(`Error fetching daily schedules for ${date}:`, error)
        return []
      }

      return data || []
    }

    const todayData = await fetchDailySchedules(today)
    const tomorrowData = await fetchDailySchedules(tomorrow)

    // Step 4: Proses data hasil query
    const processedToday = todayData.map((schedule) => {
      const busSchedule = Array.isArray(schedule.bus_schedules)
        ? schedule.bus_schedules[0]
        : schedule.bus_schedules
      const isPast = !isScheduleAvailable(busSchedule?.departure_time, schedule.schedule_date)
      return {
        id: schedule.id,
        departure_time: busSchedule?.departure_time,
        destination: busSchedule?.destination,
        current_booked: schedule.current_booked,
        max_capacity: busSchedule?.max_capacity,
        status: getCapacityStatus(schedule.current_booked, busSchedule?.max_capacity),
        schedule_date: schedule.schedule_date,
        isPast,
      }
    })

    const processedTomorrow = tomorrowData.map((schedule) => {
      const busSchedule = Array.isArray(schedule.bus_schedules)
        ? schedule.bus_schedules[0]
        : schedule.bus_schedules
      return {
        id: schedule.id,
        departure_time: busSchedule?.departure_time,
        destination: busSchedule?.destination,
        current_booked: schedule.current_booked,
        max_capacity: busSchedule?.max_capacity,
        status: getCapacityStatus(schedule.current_booked, busSchedule?.max_capacity),
        schedule_date: schedule.schedule_date,
        isPast: false,
      }
    })

    setTodaySchedules(processedToday)
    setTomorrowSchedules(processedTomorrow)
  } catch (error) {
    console.error("Error fetching schedules:", error)
  } finally {
    setLoading(false)
  }
}


    fetchSchedules()

    // Subscribe to real-time updates
    const todayChannel = supabase
      .channel(`capacity-${hotelSlug}-${today}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "daily_schedules",
          filter: `schedule_date=eq.${today}`,
        },
        (payload) => {
          setTodaySchedules((prev) =>
            prev.map((schedule) =>
              schedule.id === payload.new.id
                ? {
                    ...schedule,
                    current_booked: payload.new.current_booked,
                    status: getCapacityStatus(payload.new.current_booked, schedule.max_capacity),
                  }
                : schedule,
            ),
          )
        },
      )
      .subscribe()

    const tomorrowChannel = supabase
      .channel(`capacity-${hotelSlug}-${tomorrow}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "daily_schedules",
          filter: `schedule_date=eq.${tomorrow}`,
        },
        (payload) => {
          setTomorrowSchedules((prev) =>
            prev.map((schedule) =>
              schedule.id === payload.new.id
                ? {
                    ...schedule,
                    current_booked: payload.new.current_booked,
                    status: getCapacityStatus(payload.new.current_booked, schedule.max_capacity),
                  }
                : schedule,
            ),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(todayChannel)
      supabase.removeChannel(tomorrowChannel)
    }
  }, [hotelSlug])

  return { todaySchedules, tomorrowSchedules, loading }
}
