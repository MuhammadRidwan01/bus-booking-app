import { getSchedules, getHotels } from "../data"
import SchedulesClient from "./SchedulesClient"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

export default async function AdminSchedulesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams
  const today = format(new Date(), "yyyy-MM-dd")
  const defaultEnd = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  const initialFilters = {
    startDate: params.startDate ?? today,
    endDate: params.endDate ?? defaultEnd,
    hotelId: params.hotelId,
    status: params.status,
  }
  const [schedules, hotels] = await Promise.all([
    getSchedules(initialFilters),
    getHotels(),
  ])

  return <SchedulesClient initialSchedules={schedules as any} hotels={hotels} initialFilters={initialFilters} />
}
