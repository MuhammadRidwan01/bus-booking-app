"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { TerminalMeetingPoint } from "@/types"

export function useTerminalMeetingPoints() {
  const [terminalMeetingPoints, setTerminalMeetingPoints] = useState<TerminalMeetingPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTerminalMeetingPoints() {
      try {
        setLoading(true)

        const { data, error } = await supabase
          .from("terminal_meeting_points")
          .select("*")
          .order("terminal_code")

        if (error) {
          console.error("Error fetching terminal meeting points:", error)
          return
        }

        const mappedData: TerminalMeetingPoint[] = (data || []).map((point) => ({
          id: point.id,
          terminalCode: point.terminal_code,
          locationDescription: point.location_description,
          arrivalTimeOffsetMin: point.arrival_time_offset_min,
          arrivalTimeOffsetMax: point.arrival_time_offset_max,
        }))

        setTerminalMeetingPoints(mappedData)
      } catch (error) {
        console.error("Error fetching terminal meeting points:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTerminalMeetingPoints()
  }, [])

  return { terminalMeetingPoints, loading }
}