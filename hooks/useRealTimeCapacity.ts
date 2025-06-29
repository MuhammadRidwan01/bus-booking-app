"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { ScheduleWithCapacity } from "@/types"
import { getCapacityStatus, isScheduleAvailable } from "@/lib/utils"
import { format, addDays } from "date-fns"

// Types
type BusSchedule = {
  departure_time: string
  destination: string
  max_capacity: number
}

type DailyScheduleResponse = {
  id: string
  schedule_date: string
  current_booked: number
  status: string
  bus_schedule_id: string
  bus_schedules: BusSchedule
}

type ChannelStatus = 'SUBSCRIBED' | 'CLOSED' | 'TIMED_OUT' | 'CHANNEL_ERROR' | null

// Helper functions
const createRealtimeChannel = (
  hotelSlug: string, 
  date: string,
  onUpdate: (updater: (prev: ScheduleWithCapacity[]) => ScheduleWithCapacity[]) => void,
  setIsConnected: (status: boolean) => void,
  setChannelStatus: (status: ChannelStatus) => void,
  setLastUpdate: (time: number) => void
) => {
  return supabase
    .channel(`capacity-${hotelSlug}-${date}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "daily_schedules",
        filter: `schedule_date=eq.${date}`,
      },
      (payload: { new: { id: string; current_booked: number } }) => {
        onUpdate((prev: ScheduleWithCapacity[]) =>
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
        setIsConnected(true)
        setChannelStatus('SUBSCRIBED')
        setLastUpdate(Date.now())  // ✅ Update lastUpdate saat realtime update masuk
      },
    )
    .on('presence', { event: 'sync' }, () => {
      setIsConnected(true)
      setChannelStatus('SUBSCRIBED')
    })
    .on('broadcast', { event: 'disconnect' }, () => {
      setIsConnected(false)
      setChannelStatus('CLOSED')
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true)
        setChannelStatus('SUBSCRIBED')
      } else if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false)
        setChannelStatus(status)
      }
    })
    
}

const processSchedule = (
  schedule: DailyScheduleResponse, 
  checkPast: boolean = true
): ScheduleWithCapacity => {
  const isPast = checkPast && !isScheduleAvailable(schedule.bus_schedules.departure_time, schedule.schedule_date)
  const status: ScheduleWithCapacity['status'] = schedule.status === "expired" 
    ? "expired"
    : getCapacityStatus(schedule.current_booked, schedule.bus_schedules.max_capacity) as "available" | "almost-full" | "full"

  return {
    id: schedule.id,
    departure_time: schedule.bus_schedules.departure_time,
    destination: schedule.bus_schedules.destination,
    current_booked: schedule.current_booked,
    max_capacity: schedule.bus_schedules.max_capacity,
    status,
    schedule_date: schedule.schedule_date,
    isPast: isPast || schedule.status === "expired",
  }
}

const fetchDailySchedules = async (
  date: string, 
  busScheduleIds: string[]
): Promise<DailyScheduleResponse[]> => {
  const { data, error } = await supabase
    .from("daily_schedules")
    .select(`
      id,
      schedule_date,
      current_booked,
      status,
      bus_schedule_id,
      bus_schedules:bus_schedule_id (
        departure_time,
        destination,
        max_capacity
      )
    `)
    .eq("schedule_date", date)
    .in("bus_schedule_id", busScheduleIds)
    .in("status", ["active", "expired"])

  if (error) {
    console.error(`Error fetching daily schedules for ${date}:`, error)
    return []
  }

  return (data || [])
    .filter((schedule): schedule is (typeof schedule & { bus_schedules: BusSchedule }) => 
      schedule.bus_schedules !== null && 
      typeof schedule.bus_schedules === 'object' &&
      'departure_time' in schedule.bus_schedules &&
      'destination' in schedule.bus_schedules &&
      'max_capacity' in schedule.bus_schedules
    )
    .map(schedule => ({
      id: schedule.id.toString(),
      schedule_date: schedule.schedule_date,
      current_booked: schedule.current_booked,
      status: schedule.status,
      bus_schedule_id: schedule.bus_schedule_id,
      bus_schedules: schedule.bus_schedules
    }))
}

// Main hook
export function useRealTimeCapacity(hotelSlug: string) {
  const [todaySchedules, setTodaySchedules] = useState<ScheduleWithCapacity[]>([])
  const [tomorrowSchedules, setTomorrowSchedules] = useState<ScheduleWithCapacity[]>([])
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const [channels, setChannels] = useState<ReturnType<typeof supabase.channel>[]>([])
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [channelStatus, setChannelStatus] = useState<ChannelStatus>('SUBSCRIBED')

  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd")
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd")
    
    async function fetchSchedules() {
      try {
        setLoading(true)

        // Get hotel ID from slug
        const { data: hotel, error: hotelError } = await supabase
          .from("hotels")
          .select("id")
          .eq("slug", hotelSlug)
          .single()

        if (hotelError || !hotel) {
          console.error("Error fetching hotel:", hotelError)
          return
        }

        // Get bus schedules for the hotel
        const { data: busSchedules, error: busError } = await supabase
          .from("bus_schedules")
          .select("id")
          .eq("hotel_id", hotel.id)

        if (busError || !busSchedules?.length) {
          console.error("Error fetching bus schedules:", busError)
          return
        }

        const busScheduleIds = busSchedules.map((b) => b.id)

        // Fetch and process schedules
        const todayData = await fetchDailySchedules(today, busScheduleIds)
        const tomorrowData = await fetchDailySchedules(tomorrow, busScheduleIds)

        setTodaySchedules(todayData.map(schedule => processSchedule(schedule, true)))
        setTomorrowSchedules(tomorrowData.map(schedule => processSchedule(schedule, false)))
      } catch (error) {
        console.error("Error fetching schedules:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSchedules()

    // Set up realtime channels
    const todayChannel = createRealtimeChannel(hotelSlug, today, setTodaySchedules, setIsConnected, setChannelStatus, setLastUpdate)
    const tomorrowChannel = createRealtimeChannel(hotelSlug, tomorrow, setTomorrowSchedules, setIsConnected, setChannelStatus, setLastUpdate)
    setChannels([todayChannel, tomorrowChannel])

    // Cleanup
    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch))
    }
  }, [hotelSlug])

  const reconnect = () => {
    setIsConnected(true)
    setChannelStatus('SUBSCRIBED')
    channels.forEach((ch) => supabase.removeChannel(ch))
  }

  return { 
    todaySchedules, 
    tomorrowSchedules, 
    loading, 
    isConnected, 
    reconnect, 
    channelStatus 
  }
}
