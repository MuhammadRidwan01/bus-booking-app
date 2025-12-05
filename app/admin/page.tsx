import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getAdminDashboardData } from "./data"
import { format } from "date-fns"

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Bookings today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{data.bookingsToday}</p>
            <p className="text-xs text-gray-500">Rolling 7d trend</p>
            <div className="mt-2 flex h-12 items-end gap-1">
              {data.trendBookings.map((d) => (
                <span
                  key={d.date}
                  className="flex-1 rounded-full bg-blue-100"
                  style={{ height: `${6 + d.count * 8}px` }}
                  title={`${d.date}: ${d.count}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Passengers today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{data.passengersToday}</p>
            <p className="text-xs text-gray-500">Based on confirmed bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">WA success (7d)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-3xl font-semibold tracking-tight">{data.waSuccessRate}%</p>
              <Badge variant={data.waSuccessRate >= 90 ? "default" : data.waSuccessRate >= 75 ? "secondary" : "destructive"}>
                {data.waSuccessRate >= 90 ? "Healthy" : data.waSuccessRate >= 75 ? "Watch" : "Action"}
              </Badge>
            </div>
            <Progress value={data.waSuccessRate} />
            <p className="text-xs text-gray-500">Includes all tickets created in the last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Send queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold tracking-tight">{data.pendingSendQueue}</p>
            <p className="text-xs text-gray-500">Pending WhatsApp sends</p>
            <div className="text-xs text-gray-600">
              <p>Failures (24h): <span className="font-medium text-gray-900">{data.waFailed24h}</span></p>
              <p>Active schedules: <span className="font-medium text-gray-900">{data.activeSchedules}</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming departures (today & tomorrow)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.upcoming.length === 0 ? (
            <p className="text-sm text-gray-600">No departures in the next two days.</p>
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
                        <span>{item.current_booked}/{item.max_capacity} passengers</span>
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
