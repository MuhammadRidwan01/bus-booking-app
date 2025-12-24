import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getBookings, getHotels } from "@/app/admin/data"
import DriverClient from "./DriverClient"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

export default async function DriverPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  
  // Default to today's bookings for drivers
  const today = format(new Date(), "yyyy-MM-dd")
  const filters = {
    startDate: (params.startDate as string) || today,
    endDate: (params.endDate as string) || today,
    hotelId: params.hotelId as string,
    status: (params.status as string) || "confirmed", // Only show confirmed bookings
    search: params.search as string,
    roomNumber: params.roomNumber as string,
    flightNumber: params.flightNumber as string,
    hasSurfboard: params.hasSurfboard === "true" ? true : undefined,
    hasExcessBaggage: params.hasExcessBaggage === "true" ? true : undefined,
  }

  const [bookings, hotels] = await Promise.all([
    getBookings(filters),
    getHotels(),
  ])

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<div>Loading...</div>}>
        <DriverClient
          initialBookings={bookings}
          hotels={hotels}
          initialFilters={filters}
        />
      </Suspense>
    </div>
  )
}