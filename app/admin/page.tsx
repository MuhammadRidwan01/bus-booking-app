import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getAdminDashboardData } from "./data"
import { format } from "date-fns"

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Bookings Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.bookingsToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Passengers Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.passengersToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>WA Success 7d</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold">{data.waSuccessRate}%</p>
            <Progress value={data.waSuccessRate} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Departures (today & tomorrow)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.upcoming.length === 0 ? (
            <p className="text-sm text-gray-600">Tidak ada jadwal dalam 2 hari ke depan.</p>
          ) : (
            <div className="space-y-3">
              {data.upcoming.map((item) => {
                const occupancy = item.max_capacity ? Math.round((item.current_booked / item.max_capacity) * 100) : 0
                return (
                  <div key={item.id} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{item.hotel_name ?? "Hotel"}</p>
                      <p className="text-lg font-semibold">{item.destination}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(item.schedule_date), "dd MMM yyyy")} · {item.departure_time}
                      </p>
                    </div>
                    <div className="w-full md:w-64">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{item.current_booked}/{item.max_capacity} penumpang</span>
                        <Badge variant={occupancy >= 90 ? "destructive" : occupancy >= 70 ? "secondary" : "default"}>
                          {occupancy}%
                        </Badge>
                      </div>
                      <Progress value={occupancy} className="mt-2" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
