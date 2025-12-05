import type React from "react"
import { format } from "date-fns"
import { AlertCircle, Clock3, ShieldCheck, SendHorizontal, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getSystemHealthData } from "../data"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function SystemHealthPage() {
  const data = await getSystemHealthData()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <HealthStat
          title="Send queue"
          value={data.pendingSendQueue}
          icon={<SendHorizontal className="h-4 w-4" />}
          description="WhatsApp pending tickets"
          tone={data.pendingSendQueue > 10 ? "warn" : "ok"}
        />
        <HealthStat
          title="WA failures (24h)"
          value={data.waFailures.length}
          icon={<AlertCircle className="h-4 w-4" />}
          description="Failed attempts in the last 24 hours"
          tone={data.waFailures.length > 0 ? "warn" : "ok"}
        />
        <HealthStat
          title="Hot routes"
          value={data.hotSchedules.length}
          icon={<Zap className="h-4 w-4" />}
          description="Schedules ≥85% occupancy"
          tone="ok"
        />
        <HealthStat
          title="Last booking"
          value={data.latestBookingAt ? format(new Date(data.latestBookingAt), "dd MMM HH:mm") : "N/A"}
          icon={<Clock3 className="h-4 w-4" />}
          description="Most recent booking timestamp"
          tone="ok"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>WhatsApp send failures (last 24h)</CardTitle>
            <Badge variant={data.waFailures.length ? "destructive" : "secondary"}>
              {data.waFailures.length ? `${data.waFailures.length} to review` : "Clear"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.waFailures.length === 0 ? (
              <p className="text-sm text-gray-600">No failed sends detected.</p>
            ) : (
              <div className="space-y-2">
                {data.waFailures.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>{item.booking_code}</span>
                      <Badge variant="outline">Attempts logged</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{item.customer_name}</p>
                    <p className="text-xs text-gray-500">Phone: {item.phone}</p>
                    <p className="mt-2 text-xs text-red-600">{item.whatsapp_last_error ?? "Unknown error"}</p>
                    <p className="text-xs text-gray-500 mt-1">Last tried: {format(new Date(item.created_at), "dd MMM HH:mm")}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Overdue schedules</CardTitle>
            <Badge variant={data.overdueSchedules.length ? "destructive" : "secondary"}>
              {data.overdueSchedules.length ? `${data.overdueSchedules.length} items` : "Clear"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.overdueSchedules.length === 0 ? (
              <p className="text-sm text-gray-600">No active schedules are past their date.</p>
            ) : (
              <div className="space-y-2">
                {data.overdueSchedules.map((row) => {
                  const maxCapacity = (row as any).bus_schedules?.max_capacity ?? 0
                  const occupancy = maxCapacity ? Math.round((row.current_booked / maxCapacity) * 100) : 0
                  return (
                    <div key={row.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span>{(row as any).bus_schedules?.destination ?? "Route"}</span>
                        <Badge variant="outline">{(row as any).bus_schedules?.hotels?.name ?? "Hotel"}</Badge>
                      </div>
                      <p className="text-sm text-gray-700">{format(new Date(row.schedule_date), "dd MMM yyyy")} · {(row as any).bus_schedules?.departure_time}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>{row.current_booked}/{maxCapacity || "?"} passengers</span>
                          <span>{occupancy}%</span>
                        </div>
                        <Progress value={occupancy} className="mt-1" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>High-occupancy routes (≥85%)</CardTitle>
          <Badge variant="outline">{data.hotSchedules.length} monitored</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {data.hotSchedules.length === 0 ? (
            <p className="text-sm text-gray-600">No routes over 85% yet.</p>
          ) : (
            data.hotSchedules.map((row) => (
              <div key={row.id} className="rounded-lg border bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{row.destination}</span>
                  <Badge variant={row.occupancy >= 95 ? "destructive" : "secondary"}>{row.occupancy}%</Badge>
                </div>
                <p className="text-sm text-gray-700">{row.hotel_name ?? "Hotel"} · {format(new Date(row.schedule_date), "dd MMM")} · {row.departure_time}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Recent admin actions</CardTitle>
          <Badge variant="outline">Audit trail</Badge>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {data.logs.length === 0 ? (
            <p className="text-sm text-gray-600">No admin actions logged yet.</p>
          ) : (
            data.logs.map((log) => (
              <div key={log.id} className="rounded-lg border bg-gray-50 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>{log.action}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{format(new Date(log.created_at), "dd MMM yyyy HH:mm")}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function HealthStat({
  title,
  value,
  description,
  icon,
  tone = "ok",
}: {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  tone?: "ok" | "warn"
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", tone === "warn" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700")}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
          <p className="text-2xl font-semibold leading-tight text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
