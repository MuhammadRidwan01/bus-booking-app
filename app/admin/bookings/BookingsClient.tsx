"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import { Copy, Eye, Filter, Loader2, MessageCircle, Plus, XCircle } from "lucide-react"
import type { BookingDetails, Hotel } from "@/types"
import {
  cancelBooking,
  exportBookingsCsv,
  fetchBookingsAction,
  fetchPassengerHistory,
  resendWhatsapp,
} from "@/app/admin/actions"

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

export default function BookingsClient({
  initialBookings,
  hotels,
  initialFilters,
}: Props) {
  const [bookings, setBookings] = useState<BookingDetails[]>(initialBookings)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [loading, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [detailBooking, setDetailBooking] = useState<BookingDetails | null>(null)
  const [history, setHistory] = useState<any[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    hotelId: initialFilters.hotelId ?? hotels[0]?.id ?? "",
    scheduleId: "none",
    customerName: "",
    phoneNumber: "",
    passengerCount: 1,
    roomNumber: "",
  })
  const [schedules, setSchedules] = useState<any[]>([])
  const [schedulesLoading, setSchedulesLoading] = useState(false)
  const [scheduleDays, setScheduleDays] = useState(30)
  const [creating, setCreating] = useState(false)

  // ---- Derived data ----
  const selectedSchedule = useMemo(
    () =>
      schedules.find(
        (s: any) => s.daily_schedule_id === form.scheduleId,
      ),
    [schedules, form.scheduleId],
  )

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
  }, [searchParams])

  // Persist filters
  useEffect(() => {
    localStorage.setItem("admin-bookings-filters", JSON.stringify(filters))
  }, [filters])

  const syncUrl = (next: Filters) => {
    const params = new URLSearchParams()
    Object.entries(next).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value))
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

  const handleResetFilters = () => {
    load(initialFilters)
    toast.success("Filter direset")
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
    const confirmed = confirm(
      "Yakin batalkan booking ini dan kembalikan kapasitas?",
    )
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
    const payload =
      range === "today"
        ? {
            startDate: format(new Date(), "yyyy-MM-dd"),
            endDate: format(new Date(), "yyyy-MM-dd"),
          }
        : filters
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
      const res = await fetch(
        `/api/admin-available-schedules?hotelId=${hotelId}&days=${scheduleDays}`,
        { credentials: "include" },
      ).then((r) => r.json())
      if (res.ok) {
        setSchedules(res.data)
        if (res.data.length > 0) {
          setForm((f) => ({
            ...f,
            scheduleId: res.data[0].daily_schedule_id,
          }))
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
    if (form.hotelId && createOpen) {
      fetchSchedules(form.hotelId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.hotelId, scheduleDays, createOpen])

  const handleCreate = async () => {
    if (
      !form.hotelId ||
      form.scheduleId === "none" ||
      !form.customerName ||
      !form.phoneNumber ||
      !form.roomNumber
    ) {
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
        setForm({
          hotelId: form.hotelId,
          scheduleId: "",
          customerName: "",
          phoneNumber: "",
          passengerCount: 1,
          roomNumber: "",
        })
        load(filters)
      }
    } catch (err) {
      toast.error("Gagal membuat booking")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* FILTERS */}
      <Card className="border-none bg-gradient-to-b from-background to-muted/40 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Filter className="h-4 w-4 text-primary" />
            </span>
            <div>
              <CardTitle className="text-base font-semibold">
                Filters
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Batasi data booking supaya lebih mudah dibaca.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={handleResetFilters}
            >
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-1.5">
            <Label className="text-xs">Start date</Label>
            <Input
              type="date"
              value={filters.startDate ?? ""}
              onChange={(e) =>
                load({ ...filters, startDate: e.target.value || undefined })
              }
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">End date</Label>
            <Input
              type="date"
              value={filters.endDate ?? ""}
              onChange={(e) =>
                load({ ...filters, endDate: e.target.value || undefined })
              }
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hotel</Label>
            <Select
              value={filters.hotelId ?? "all"}
              onValueChange={(val) =>
                load({ ...filters, hotelId: val === "all" ? undefined : val })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All hotels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {hotels.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status booking</Label>
            <Select
              value={filters.status ?? "all"}
              onValueChange={(val) =>
                load({
                  ...filters,
                  status: val === "all" ? undefined : val,
                })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">WA status</Label>
            <Select
              value={filters.waStatus ?? "all"}
              onValueChange={(val) =>
                load({ ...filters, waStatus: val as Filters["waStatus"] })
              }
            >
              <SelectTrigger className="h-9 text-xs">
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
          <div className="space-y-1.5">
            <Label className="text-xs">Search (code / phone)</Label>
            <Input
              placeholder="IBX... / 62xxxx"
              value={filters.search ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              onBlur={(e) =>
                load({ ...filters, search: e.target.value || undefined })
              }
              className="h-9 text-xs"
            />
          </div>
          <div className="col-span-full flex flex-wrap items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("current")}
            >
              Export current
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExport("today")}
            >
              Export today
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* BOOKINGS TABLE */}
      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b pb-3">
          <div>
            <CardTitle className="text-base font-semibold">
              Bookings
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {bookings.length} rows • data real-time berdasarkan filter.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  New Booking
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader className="space-y-1">
                  <DialogTitle>Buat Booking</DialogTitle>
                  <DialogDescription className="text-xs">
                    Tambah booking baru secara manual. Pastikan jadwal dan
                    kapasitas masih tersedia.
                  </DialogDescription>
                </DialogHeader>

                {/* Jadwal summary */}
                <div className="mt-1 grid gap-4">
                  <div className="grid gap-4 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">
                      Ringkasan Jadwal
                    </p>
                    {selectedSchedule ? (
                      <div className="space-y-1">
                        <p>
                          <span className="font-semibold">
                            {selectedSchedule.schedule_date}
                          </span>{" "}
                          • {selectedSchedule.departure_time} •{" "}
                          {selectedSchedule.destination}
                        </p>
                        <p>
                          Sisa kursi:{" "}
                          <span className="font-semibold">
                            {selectedSchedule.available_seats}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs">
                        Pilih hotel & jadwal terlebih dahulu.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Hotel</Label>
                      <Select
                        value={form.hotelId}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, hotelId: v }))
                        }
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Pilih hotel" />
                        </SelectTrigger>
                        <SelectContent>
                          {hotels.map((h) => (
                            <SelectItem key={h.id} value={h.id}>
                              {h.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Rentang hari</Label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={scheduleDays}
                        onChange={(e) =>
                          setScheduleDays(Number(e.target.value) || 1)
                        }
                        className="h-9 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Tampilkan jadwal hingga {scheduleDays} hari ke depan.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Jadwal</Label>
                    <Select
                      value={form.scheduleId}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, scheduleId: v }))
                      }
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Pilih jadwal" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectItem value="none" disabled>
                          Pilih jadwal
                        </SelectItem>
                        {schedules.length === 0 && (
                          <SelectItem value="no-available" disabled>
                            Tidak ada jadwal
                          </SelectItem>
                        )}
                        {schedules.map((s: any) => (
                          <SelectItem
                            key={s.daily_schedule_id}
                            value={s.daily_schedule_id}
                          >
                            {s.schedule_date} • {s.departure_time} •{" "}
                            {s.destination} ({s.available_seats} seat)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {schedulesLoading && (
                      <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Memuat jadwal...
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Nama</Label>
                      <Input
                        value={form.customerName}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            customerName: e.target.value,
                          }))
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Phone</Label>
                      <Input
                        placeholder="62xxxxxxxxxxx"
                        value={form.phoneNumber}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            phoneNumber: e.target.value,
                          }))
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Jumlah Penumpang</Label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={form.passengerCount}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            passengerCount: Number(e.target.value),
                          }))
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Nomor Kamar</Label>
                      <Input
                        placeholder="Contoh: 305 / 5A"
                        value={form.roomNumber}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            roomNumber: e.target.value,
                          }))
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-[10px] text-muted-foreground">
                    Data akan langsung tersimpan dan kapasitas ikut terpotong.
                  </p>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating && (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}
                    {creating ? "Membuat..." : "Buat Booking"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardHeader>

        <CardContent className="overflow-auto p-0">
          <div className="min-w-full overflow-auto">
            <Table className="min-w-full text-xs">
              <TableHeader className="sticky top-0 z-10 bg-muted/60">
                <TableRow className="border-b">
                  <TableHead className="whitespace-nowrap">Kode</TableHead>
                  <TableHead className="whitespace-nowrap">Created</TableHead>
                  <TableHead className="whitespace-nowrap">Hotel</TableHead>
                  <TableHead className="whitespace-nowrap">Tanggal</TableHead>
                  <TableHead className="whitespace-nowrap">Jam</TableHead>
                  <TableHead className="whitespace-nowrap">Tujuan</TableHead>
                  <TableHead className="whitespace-nowrap">Customer</TableHead>
                  <TableHead className="whitespace-nowrap">Phone</TableHead>
                  <TableHead className="whitespace-nowrap text-center">
                    Qty
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">
                    WA Status
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-right">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="py-8 text-center text-xs text-muted-foreground"
                    >
                      Belum ada booking untuk filter ini.
                    </TableCell>
                  </TableRow>
                )}
                {bookings.map((b) => (
                  <TableRow key={b.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-[11px]">
                      {b.booking_code}
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      {format(new Date(b.created_at), "dd MMM HH:mm")}
                    </TableCell>
                    <TableCell className="text-[11px]">
                      {(b as any).hotel_name}
                    </TableCell>
                    <TableCell className="text-[11px]">
                      {b.schedule_date}
                    </TableCell>
                    <TableCell className="text-[11px]">
                      {b.departure_time}
                    </TableCell>
                    <TableCell className="text-[11px]">
                      {b.destination}
                    </TableCell>
                    <TableCell className="text-[11px]">
                      {b.customer_name}
                    </TableCell>
                    <TableCell className="text-[11px]">{b.phone}</TableCell>
                    <TableCell className="text-center text-[11px]">
                      {b.passenger_count}
                    </TableCell>
                    <TableCell className="text-[11px]">
                      <Badge variant="outline" className="px-2 py-0 text-[10px]">
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px]">
                      {b.whatsapp_sent ? (
                        <Badge className="bg-emerald-100 text-[10px] font-medium text-emerald-700 hover:bg-emerald-100">
                          Sent
                        </Badge>
                      ) : b.whatsapp_attempts > 0 ? (
                        <Badge className="bg-red-100 text-[10px] font-medium text-red-700 hover:bg-red-100">
                          Failed
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-normal"
                        >
                          Not tried
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="space-x-1 whitespace-nowrap text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          navigator.clipboard.writeText(b.booking_code)
                        }
                        title="Copy code"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleResend(b.id)}
                        title="Resend WA"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Drawer>
                        <DrawerTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDetail(b)}
                            title="Detail"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent className="max-h-[80vh] overflow-auto">
                          <DrawerHeader>
                            <DrawerTitle className="text-sm font-semibold">
                              Booking {detailBooking?.booking_code ?? b.booking_code}
                            </DrawerTitle>
                          </DrawerHeader>
                          <div className="space-y-2 px-4 pb-4 text-xs">
                            <p>
                              <span className="font-semibold">Hotel:</span>{" "}
                              {(b as any).hotel_name}
                            </p>
                            <p>
                              <span className="font-semibold">Tanggal/Jam:</span>{" "}
                              {b.schedule_date} {b.departure_time}
                            </p>
                            <p>
                              <span className="font-semibold">Tujuan:</span>{" "}
                              {b.destination}
                            </p>
                            <p>
                              <span className="font-semibold">Customer:</span>{" "}
                              {b.customer_name}
                            </p>
                            <p>
                              <span className="font-semibold">Phone:</span>{" "}
                              {b.phone}
                            </p>
                            <p>
                              <span className="font-semibold">Penumpang:</span>{" "}
                              {b.passenger_count}
                            </p>
                            <p>
                              <span className="font-semibold">Room:</span>{" "}
                              {(b as any).room_number ?? "-"}
                            </p>
                            <p>
                              <span className="font-semibold">
                                WA Attempts:
                              </span>{" "}
                              {b.whatsapp_attempts}
                            </p>
                            <p>
                              <span className="font-semibold">
                                WA Last Error:
                              </span>{" "}
                              {b.whatsapp_last_error ?? "-"}
                            </p>
                            <div className="mt-4">
                              <p className="font-semibold">
                                Riwayat nomor ini
                              </p>
                              <div className="space-y-1">
                                {history.length === 0 && (
                                  <p className="text-[11px] text-muted-foreground">
                                    Belum ada data
                                  </p>
                                )}
                                {history.map((h) => (
                                  <p
                                    key={h.booking_code}
                                    className="text-[11px] text-muted-foreground"
                                  >
                                    {h.booking_code} · {h.schedule_date} ·{" "}
                                    {h.status}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DrawerContent>
                      </Drawer>
                      {b.status === "confirmed" && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCancel(b.id)}
                          title="Batalkan"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
