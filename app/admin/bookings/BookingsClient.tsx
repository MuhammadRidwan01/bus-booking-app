"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import type { BookingDetails, Hotel } from "@/types"
import { cancelBooking, exportBookingsCsv, fetchBookingsAction, fetchPassengerHistory, resendWhatsapp } from "@/app/admin/actions"

interface Filters {
  startDate?: string
  endDate?: string
  hotelId?: string
  status?: string
  waStatus?: "all" | "sent" | "failed" | "not_tried"
  search?: string
}

interface Props {
  initialBookings: BookingDetails[]
  hotels: Hotel[]
  initialFilters: Filters
}

export default function BookingsClient({ initialBookings, hotels, initialFilters }: Props) {
  const [bookings, setBookings] = useState<BookingDetails[]>(initialBookings)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [loading, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [detailBooking, setDetailBooking] = useState<BookingDetails | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ hotelId: initialFilters.hotelId ?? hotels[0]?.id ?? "", scheduleId: "none", customerName: "", phoneNumber: "", passengerCount: 1, roomNumber: "" })
  const [schedules, setSchedules] = useState<any[]>([])
  const [schedulesLoading, setSchedulesLoading] = useState(false)
  const [scheduleDays, setScheduleDays] = useState(30)
  const [creating, setCreating] = useState(false)

  // Load filters from localStorage if URL empty
  useEffect(() => {
    const hasUrlFilters = searchParams.toString().length > 0
    if (!hasUrlFilters) {
      const stored = localStorage.getItem("admin-bookings-filters")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setFilters((prev) => ({ ...prev, ...parsed }))
          startTransition(async () => {
            const data = await fetchBookingsAction(parsed)
            setBookings(data as any)
          })
        } catch (err) {
          console.error(err)
        }
      }
    }
  }, [])

  // Persist filters
  useEffect(() => {
    localStorage.setItem("admin-bookings-filters", JSON.stringify(filters))
  }, [filters])

  const syncUrl = (next: Filters) => {
    const params = new URLSearchParams()
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, String(value))
    })
    router.replace(`/admin/bookings?${params.toString()}`)
  }

  const load = (nextFilters: Filters) => {
    setFilters(nextFilters)
    syncUrl(nextFilters)
    startTransition(async () => {
      const data = await fetchBookingsAction(nextFilters as any)
      setBookings(data as any)
    })
  }

  const handleResend = async (id: string) => {
    startTransition(async () => {
      const res = await resendWhatsapp(id)
      if (res.ok) {
        toast.success("WA terkirim")
      } else {
        toast.error(`WA gagal: ${res.error ?? "unknown"}`)
      }
      const data = await fetchBookingsAction(filters as any)
      setBookings(data as any)
    })
  }

  const handleCancel = async (id: string) => {
    const confirmed = confirm("Yakin batalkan booking ini dan kembalikan kapasitas?")
    if (!confirmed) return
    startTransition(async () => {
      const res = await cancelBooking(id)
      if (res.ok) toast.success("Booking dibatalkan")
      else toast.error(res.error ?? "Gagal membatalkan")
      const data = await fetchBookingsAction(filters as any)
      setBookings(data as any)
    })
  }

  const handleExport = async (range: "current" | "today") => {
    const payload = range === "today" ? { startDate: format(new Date(), "yyyy-MM-dd"), endDate: format(new Date(), "yyyy-MM-dd") } : filters
    const csv = await exportBookingsCsv(payload as any)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `bookings_${range}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Export siap")
  }

  const openDetail = async (booking: BookingDetails) => {
    setDetailBooking(booking)
    const hist = await fetchPassengerHistory(booking.phone)
    setHistory(hist)
  }

  const fetchSchedules = async (hotelId: string) => {
    if (!hotelId) {
      setSchedules([])
      setForm((f) => ({ ...f, scheduleId: "none" }))
      return
    }
    setSchedulesLoading(true)
    try {
      const res = await fetch(`/api/admin-available-schedules?hotelId=${hotelId}&days=${scheduleDays}`, { credentials: "include" }).then((r) => r.json())
      if (res.ok) {
        setSchedules(res.data)
        if (res.data.length > 0) {
          setForm((f) => ({ ...f, scheduleId: res.data[0].daily_schedule_id }))
        } else {
          setForm((f) => ({ ...f, scheduleId: "none" }))
        }
      } else {
        toast.error(res.error ?? "Gagal mengambil jadwal")
      }
    } finally {
      setSchedulesLoading(false)
    }
  }

  useEffect(() => {
    if (form.hotelId) {
      fetchSchedules(form.hotelId)
    }
  }, [form.hotelId, scheduleDays, createOpen])

  const handleCreate = async () => {
    if (!form.hotelId || form.scheduleId === "none" || !form.customerName || !form.phoneNumber || !form.roomNumber) {
      toast.error("Lengkapi semua field")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/admin-create-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          hotelId: form.hotelId,
          dailyScheduleId: form.scheduleId,
          customerName: form.customerName,
          phoneNumber: form.phoneNumber,
          passengerCount: form.passengerCount,
          roomNumber: form.roomNumber,
        }),
      }).then((r) => r.json())

      if (!res.ok) {
        toast.error(res.error ?? "Gagal membuat booking")
      } else {
        toast.success("Booking dibuat")
        setCreateOpen(false)
        setForm({ hotelId: form.hotelId, scheduleId: "", customerName: "", phoneNumber: "", passengerCount: 1, roomNumber: "" })
        load(filters)
      }
    } catch (err) {
      toast.error("Gagal membuat booking")
    } finally {
      setCreating(false)
    }
  }

  const statusBadge = (booking: BookingDetails) => {
    const wa = booking.whatsapp_sent
      ? "Sent"
      : booking.whatsapp_attempts > 0
        ? "Failed"
        : "Not tried"
    return wa
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Start date</Label>
            <Input
              type="date"
              value={filters.startDate ?? ""}
              onChange={(e) => load({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>End date</Label>
            <Input
              type="date"
              value={filters.endDate ?? ""}
              onChange={(e) => load({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Hotel</Label>
            <Select
              value={filters.hotelId ?? "all"}
              onValueChange={(val) => load({ ...filters, hotelId: val === "all" ? undefined : val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All hotels" />
              </SelectTrigger>
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
            <Select
              value={filters.status ?? "all"}
              onValueChange={(val) => load({ ...filters, status: val === "all" ? undefined : val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>WA status</Label>
            <Select
              value={filters.waStatus ?? "all"}
              onValueChange={(val) => load({ ...filters, waStatus: val as Filters["waStatus"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="not_tried">Not tried</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Search (code/phone)</Label>
            <Input
              placeholder="IBX... / 62xxxx"
              value={filters.search ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              onBlur={(e) => load({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={() => handleExport("current")}>Export current</Button>
            <Button variant="ghost" onClick={() => handleExport("today")}>Export today</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Bookings</CardTitle>
            <p className="text-sm text-gray-500">{bookings.length} rows</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">New Booking</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Booking</DialogTitle>
                  <DialogDescription>Tambah booking baru secara manual.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="space-y-1">
                    <Label>Hotel</Label>
                    <Select value={form.hotelId} onValueChange={(v) => setForm((f) => ({ ...f, hotelId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Pilih hotel" /></SelectTrigger>
                      <SelectContent>
                        {hotels.map((h) => (
                          <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Jadwal</Label>
                      <Select value={form.scheduleId} onValueChange={(v) => setForm((f) => ({ ...f, scheduleId: v }))}>
                        <SelectTrigger><SelectValue placeholder="Pilih jadwal" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" disabled>Pilih jadwal</SelectItem>
                          {schedules.length === 0 && <SelectItem value="no-available" disabled>Tidak ada jadwal</SelectItem>}
                          {schedules.map((s: any) => (
                            <SelectItem key={s.daily_schedule_id} value={s.daily_schedule_id}>
                              {s.schedule_date} · {s.departure_time} · {s.destination} ({s.available_seats} seat)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {schedulesLoading && <p className="text-xs text-gray-500">Memuat jadwal...</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>Rentang hari</Label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={scheduleDays}
                        onChange={(e) => setScheduleDays(Number(e.target.value) || 1)}
                      />
                      <p className="text-xs text-gray-500">Tampilkan jadwal hingga {scheduleDays} hari ke depan.</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Nama</Label>
                    <Input value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Phone</Label>
                    <Input value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Jumlah Penumpang</Label>
                    <Input type="number" min={1} max={5} value={form.passengerCount} onChange={(e) => setForm((f) => ({ ...f, passengerCount: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Nomor Kamar</Label>
                    <Input value={form.roomNumber} onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))} />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button onClick={handleCreate} disabled={creating}>{creating ? "Membuat..." : "Buat Booking"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {loading && <span className="text-xs text-gray-500">Loading...</span>}
          </div>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Hotel</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>WA</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-sm text-gray-500">Belum ada booking untuk filter ini.</TableCell>
                </TableRow>
              )}
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.booking_code}</TableCell>
                  <TableCell className="text-xs text-gray-600">{format(new Date(b.created_at), "dd MMM HH:mm")}</TableCell>
                  <TableCell className="text-xs">{(b as any).hotel_name}</TableCell>
                  <TableCell className="text-xs">{b.schedule_date}</TableCell>
                  <TableCell className="text-xs">{b.departure_time}</TableCell>
                  <TableCell className="text-xs">{b.destination}</TableCell>
                  <TableCell className="text-xs">{b.customer_name}</TableCell>
                  <TableCell className="text-xs">{b.phone}</TableCell>
                  <TableCell className="text-xs">{b.passenger_count}</TableCell>
                  <TableCell className="text-xs"><Badge>{b.status}</Badge></TableCell>
                  <TableCell className="text-xs">
                    {b.whatsapp_sent ? (
                      <Badge className="bg-green-100 text-green-700">Sent</Badge>
                    ) : b.whatsapp_attempts > 0 ? (
                      <Badge className="bg-red-100 text-red-700">Failed</Badge>
                    ) : (
                      <Badge variant="secondary">Not tried</Badge>
                    )}
                  </TableCell>
                  <TableCell className="space-x-1 text-xs">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigator.clipboard.writeText(b.booking_code)} title="Copy code">📋</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleResend(b.id)} title="Resend WA">📨</Button>
                    <Drawer>
                      <DrawerTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openDetail(b)} title="Detail">👁️</Button>
                      </DrawerTrigger>
                      <DrawerContent className="max-h-[80vh] overflow-auto">
                        <DrawerHeader>
                          <DrawerTitle>Booking {b.booking_code}</DrawerTitle>
                        </DrawerHeader>
                        <div className="space-y-2 px-4 pb-4 text-sm">
                          <p><span className="font-semibold">Hotel:</span> {(b as any).hotel_name}</p>
                          <p><span className="font-semibold">Tanggal/Jam:</span> {b.schedule_date} {b.departure_time}</p>
                          <p><span className="font-semibold">Tujuan:</span> {b.destination}</p>
                          <p><span className="font-semibold">Customer:</span> {b.customer_name}</p>
                          <p><span className="font-semibold">Phone:</span> {b.phone}</p>
                          <p><span className="font-semibold">Penumpang:</span> {b.passenger_count}</p>
                          <p><span className="font-semibold">Room:</span> {(b as any).room_number ?? "-"}</p>
                          <p><span className="font-semibold">WA Attempts:</span> {b.whatsapp_attempts}</p>
                          <p><span className="font-semibold">WA Last Error:</span> {b.whatsapp_last_error ?? "-"}</p>
                          <div className="mt-4">
                            <p className="font-semibold">Riwayat nomor ini</p>
                            <div className="space-y-1">
                              {history.length === 0 && <p className="text-xs text-gray-500">Belum ada data</p>}
                              {history.map((h) => (
                                <p key={h.booking_code} className="text-xs text-gray-700">
                                  {h.booking_code} · {h.schedule_date} · {h.status}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </DrawerContent>
                    </Drawer>
                    {b.status === "confirmed" && (
                      <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleCancel(b.id)} title="Batalkan">✖</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
