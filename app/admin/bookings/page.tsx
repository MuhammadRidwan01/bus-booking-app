import { getBookings, getHotels } from "../data"
import BookingsClient from "./BookingsClient"

export const dynamic = "force-dynamic"

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams
  const initialFilters = {
    startDate: params.startDate,
    endDate: params.endDate,
    hotelId: params.hotelId,
    status: params.status,
    waStatus: (params.waStatus as any) ?? "all",
    search: params.search,
  }

  const [bookings, hotels] = await Promise.all([
    getBookings(initialFilters),
    getHotels(),
  ])

  return <BookingsClient initialBookings={bookings} hotels={hotels} initialFilters={initialFilters} />
}
