"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { cancelSchedule, exportPassengersCsv, fetchBookingsAction, fetchSchedulesAction, getSchedulePreview, runGenerateSchedules } from "@/app/admin/actions"
import type { Hotel } from "@/types"
import { addDays } from "date-fns"

interface ScheduleItem {
  id: string
  schedule_date: string
  departure_time: string
  destination: string
  max_capacity: number
  current_booked: number
  status: string
  hotel_name?: string
  hotel_id?: string
}

interface Props {
  initialSchedules: ScheduleItem[]
  hotels: Hotel[]
  initialFilters: { startDate?: string; endDate?: string; hotelId?: string; status?: string }
}

export default function SchedulesClient({ initialSchedules, hotels, initialFilters }: Props) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules)
  const [filters, setFilters] = useState(() => {
    if (typeof window === "undefined") return initialFilters
    const hasUrl = window.location.search.length > 0
    if (hasUrl) return initialFilters
    const stored = localStorage.getItem("admin-schedules-filters")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return { ...initialFilters, ...parsed }
      } catch (error) {
        console.error(error)
      }
    }
    return initialFilters
  })
  const [loading, startTransition] = useTransition()
  const [bookings, setBookings] = useState<any[]>([])
  const [previewStart, setPreviewStart] = useState(
    () => filters.startDate ?? addDays(new Date(), 1).toISOString().slice(0, 10)
  )
  const [previewDays, setPreviewDays] = useState(7)
  const [preview, setPreview] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    localStorage.setItem("admin-schedules-filters", JSON.stringify(filters))
  }, [filters])

  const syncUrl = (next: typeof filters) => {
    const params = new URLSearchParams()
    Object.entries(next).forEach(([k, v]) => {
      if (v) params.set(k, String(v))
    })
    router.replace(`/admin/schedules?${params.toString()}`)
  }

  const reload = async (next: typeof filters) => {
    setFilters(next)
    syncUrl(next)
    const data = await fetchSchedulesAction(next as any)
    setSchedules(data as any)
  }

  const occupancyClass = (pct: number) => {
    if (pct >= 80) return "bg-orange-100 text-orange-700"
    if (pct <= 20) return "bg-blue-100 text-blue-700"
    return "bg-gray-100 text-gray-700"
  }

  const openDetail = async (s: ScheduleItem) => {
    setBookings([])
    const res = await fetch(`/api/admin-bookings?dailyScheduleId=${s.id}`, { credentials: "include" }).then((r) => r.json())
    if (res.ok) {
      setBookings(res.data as any)
    } else {
      toast.error(res.error ?? "Gagal ambil bookings")
    }
  }

  const handleCancel = async (id: string) => {
    const confirmed = confirm("Batalkan jadwal ini?")
    if (!confirmed) return
    const res = await cancelSchedule(id)
    if (res.ok) {
      toast.success("Jadwal dibatalkan")
      reload(filters)
    } else {
      toast.error(res.error ?? "Gagal batalkan jadwal")
    }
  }

  const handleExportPassengers = async (id: string) => {
    const csv = await exportPassengersCsv(id)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `schedule_${id}_passengers.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Export penumpang siap")
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Generate Daily Schedules</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <Label>Start date</Label>
            <Input type="date" value={previewStart} onChange={(e) => setPreviewStart(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Days</Label>
            <Input
              type="number"
              min={1}
              max={30}
              value={previewDays}
              onChange={(e) => setPreviewDays(Number(e.target.value))}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                const data = await getSchedulePreview(previewStart, previewDays)
                setPreview(data)
              }}
            >
              Preview
            </Button>
            <Button
              onClick={async () => {
                const ok = confirm(`Generate schedules for ${previewDays} hari mulai ${previewStart}?`)
                if (!ok) return
                const res = await runGenerateSchedules(previewDays, previewStart)
                if (res.ok) {
                  toast.success("Generate berhasil")
                  const refreshed = await fetchSchedulesAction(filters as any)
                  setSchedules(refreshed as any)
                } else {
                  toast.error(res.error ?? "Gagal generate")
                }
              }}
            >
              Generate
            </Button>
          </div>
        </CardContent>
        {preview.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-sm font-semibold mb-2">Preview ({preview.length} entries)</p>
            <div className="max-h-48 overflow-auto rounded border bg-slate-50 p-3 text-xs space-y-1">
              {preview.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span>{p.date}</span>
                  <span>{p.hotel}</span>
                  <span>{p.departure_time}</span>
                  <span>{p.destination}</span>
                  <span>{p.max_capacity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <Label>Start</Label>
            <Input type="date" value={filters.startDate ?? ""} onChange={(e) => reload({ ...filters, startDate: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>End</Label>
            <Input type="date" value={filters.endDate ?? ""} onChange={(e) => reload({ ...filters, endDate: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Hotel</Label>
            <Select value={filters.hotelId ?? "all"} onValueChange={(v) => reload({ ...filters, hotelId: v === "all" ? undefined : v })}>
              <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {hotels.map((h) => (
                  <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={filters.status ?? "all"} onValueChange={(v) => reload({ ...filters, status: v === "all" ? undefined : v })}>
              <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Daily schedules</CardTitle>
            <p className="text-sm text-gray-500">{schedules.length} rows</p>
          </div>
          {loading && <span className="text-xs text-gray-500">Loading...</span>}
        </CardHeader>
        <CardContent className="space-y-3">
          {schedules.length === 0 && <p className="text-sm text-gray-500">Tidak ada jadwal.</p>}
          {schedules.map((s) => {
            const pct = s.max_capacity ? Math.round((s.current_booked / s.max_capacity) * 100) : 0
            const future = new Date(s.schedule_date) >= new Date(new Date().toDateString())
            return (
              <div key={s.id} className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs text-gray-500">{s.hotel_name}</p>
                  <p className="text-sm font-semibold">{s.destination}</p>
                  <p className="text-xs text-gray-600">{s.schedule_date} · {s.departure_time}</p>
                  <div className="mt-1 flex gap-2 text-xs">
                    <Badge className={occupancyClass(pct)}>{pct}% terisi</Badge>
                    <Badge variant="outline">{s.status}</Badge>
                  </div>
                </div>
                <div className="w-full md:w-64">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{s.current_booked}/{s.max_capacity} penumpang</span>
                  </div>
                  <Progress value={pct} className="mt-2" />
                  <div className="mt-2 flex gap-2">
                    <Drawer>
                      <DrawerTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => openDetail(s)}>Detail</Button>
                      </DrawerTrigger>
                      <DrawerContent className="max-h-[80vh] overflow-auto">
                        <DrawerHeader>
                          <DrawerTitle>Schedule {s.schedule_date} {s.departure_time}</DrawerTitle>
                        </DrawerHeader>
                        <div className="px-4 pb-4">
                          <p className="text-sm text-gray-600">{s.hotel_name} · {s.destination}</p>
                          <div className="mt-3">
                            <p className="font-semibold text-sm">Bookings</p>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Kode</TableHead>
                                  <TableHead>Nama</TableHead>
                                  <TableHead>Phone</TableHead>
                                  <TableHead>Qty</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {bookings.length === 0 && (
                                  <TableRow><TableCell colSpan={4} className="text-xs text-gray-500">Tidak ada booking</TableCell></TableRow>
                                )}
                                {bookings.map((b) => (
                                  <TableRow key={b.booking_code}>
                                    <TableCell className="text-xs font-mono">{b.booking_code}</TableCell>
                                    <TableCell className="text-xs">{b.customer_name}</TableCell>
                                    <TableCell className="text-xs">{b.phone}</TableCell>
                                    <TableCell className="text-xs">{b.passenger_count}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            <Button variant="outline" size="sm" className="mt-3" onClick={() => handleExportPassengers(s.id)}>
                              Export passengers CSV
                            </Button>
                          </div>
                        </div>
                      </DrawerContent>
                    </Drawer>
                    {future && s.status === "active" && (
                      <Button variant="destructive" size="sm" onClick={() => handleCancel(s.id)}>Cancel</Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
