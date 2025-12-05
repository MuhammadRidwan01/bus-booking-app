import { getSchedules, getHotels } from "../data"
import SchedulesClient from "./SchedulesClient"
import { addDays, format } from "date-fns"

export const dynamic = "force-dynamic"

export default async function AdminSchedulesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams
  const today = format(new Date(), "yyyy-MM-dd")
  const defaultEnd = format(addDays(new Date(), 7), "yyyy-MM-dd")
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
