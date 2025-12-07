import BusSchedulesClient from "./BusSchedulesClient"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { getHotels } from "../data"

export default async function BusSchedulesPage() {
  const supabase = await getSupabaseAdmin()
  const [busSchedules, hotels] = await Promise.all([
    supabase
      .from("bus_schedules")
      .select("id, departure_time, destination, max_capacity, is_active, hotels(name, id)")
      .order("departure_time"),
    getHotels(),
  ])

  const rows =
    busSchedules.data?.map((r) => ({
      id: r.id,
      departure_time: r.departure_time,
      destination: r.destination,
      max_capacity: r.max_capacity,
      is_active: r.is_active,
      hotel_name: (r as any).hotels?.name ?? "",
      hotel_id: (r as any).hotels?.id ?? "",
    })) ?? []

  return <BusSchedulesClient rows={rows} hotels={hotels} />
}
