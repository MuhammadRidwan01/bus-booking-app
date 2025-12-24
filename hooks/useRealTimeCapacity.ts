"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { ScheduleWithCapacity } from "@/types"
import { getCapacityStatus, isScheduleAvailable } from "@/lib/utils"
import { format, addDays } from "date-fns"

export function useRealTimeCapacity(hotelSlug: string, serviceType?: 'drop_off' | 'pick_up') {
  const [todaySchedules, setTodaySchedules] = useState<ScheduleWithCapacity[]>([])
  const [tomorrowSchedules, setTomorrowSchedules] = useState<ScheduleWithCapacity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd")
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd")
    console.log("Today:", today, "Tomorrow:", tomorrow, "Service Type:", serviceType)

    async function fetchSchedules() {
      try {
        setLoading(true)

        // Step 1: Handle slug variations
        // 'hotels' table uses hyphens ("ibis-styles")
        // 'daily_schedules' table uses underscores ("ibis_style") legacy format
        const hotelTableSlug = hotelSlug
        const scheduleTableSlug = hotelSlug === "ibis-styles" ? "ibis_style" :
          hotelSlug === "ibis-budget" ? "ibis_budget" :
            hotelSlug.replace(/-/g, '_')

        // Get hotel ID using the hyphenated slug
        const { data: hotel, error: hotelError } = await supabase
          .from("hotels")
          .select("id")
          .eq("slug", hotelTableSlug)
          .single()

        if (hotelError) {
          console.error("Error fetching hotel:", hotelError)
          return
        }
        if (!hotel) {
          console.warn("Hotel not found for slug:", hotelTableSlug)
          return
        }

        // Step 2: Fetch daily_schedules using the underscored slug
        const fetchDailySchedules = async (date: string) => {
          let query = supabase
            .from("daily_schedules")
            .select(`
              id,
              schedule_date,
              current_booked,
              status,
              service_type,
              departure_time,
              capacity,
              hotel,
              bus_schedule_id,
              bus_schedules (
                departure_time,
                destination,
                max_capacity,
                hotel_id
              )
            `)
            .eq("schedule_date", date)
            .eq("hotel", scheduleTableSlug)
            .eq("status", "active")

          // Filter by service type if provided
          if (serviceType) {
            query = query.eq("service_type", serviceType)
          }

          const { data, error } = await query

          if (error) {
            console.error(`Error fetching daily schedules for ${date}:`, error)
            return []
          }

          return data || []
        }

        const todayData = await fetchDailySchedules(today)
        const tomorrowData = await fetchDailySchedules(tomorrow)

        // Step 3: Process data results
        const processScheduleData = (scheduleData: any[], isToday: boolean) => {
          return scheduleData.map((schedule) => {
            const busSchedule = Array.isArray(schedule.bus_schedules)
              ? schedule.bus_schedules[0]
              : schedule.bus_schedules

            // Use departure_time from daily_schedules if available, otherwise from bus_schedules
            const departureTime = schedule.departure_time || busSchedule?.departure_time

            // Use capacity from daily_schedules if available, otherwise from bus_schedules
            const maxCapacity = schedule.capacity || busSchedule?.max_capacity

            // Determine destination based on service type
            let destination = busSchedule?.destination
            if (!destination) {
              // Only fallback if absolutely no data
              destination = 'Unknown Destination'
            }

            const isPast = isToday && !isScheduleAvailable(departureTime, schedule.schedule_date)

            return {
              id: schedule.id,
              departure_time: departureTime,
              destination: destination,
              current_booked: schedule.current_booked,
              max_capacity: maxCapacity,
              status: getCapacityStatus(schedule.current_booked, maxCapacity),
              schedule_date: schedule.schedule_date,
              service_type: schedule.service_type,
              isPast,
            }
          })
        }

        const processedToday = processScheduleData(todayData, true)
        const processedTomorrow = processScheduleData(tomorrowData, false)

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
      .channel(`capacity-${hotelSlug}-${today}${serviceType ? `-${serviceType}` : ''}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "daily_schedules",
          filter: `schedule_date=eq.${today}`,
        },
        (payload) => {
          // Only update if service type matches (if filtering is enabled)
          if (serviceType && payload.new.service_type !== serviceType) {
            return
          }

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
      .channel(`capacity-${hotelSlug}-${tomorrow}${serviceType ? `-${serviceType}` : ''}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "daily_schedules",
          filter: `schedule_date=eq.${tomorrow}`,
        },
        (payload) => {
          // Only update if service type matches (if filtering is enabled)
          if (serviceType && payload.new.service_type !== serviceType) {
            return
          }

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
  }, [hotelSlug, serviceType])

  return { todaySchedules, tomorrowSchedules, loading }
}
