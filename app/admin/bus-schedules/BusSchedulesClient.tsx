"use client"

import { useMemo, useState, useTransition } from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Pencil, Plus, Save, ShieldAlert } from "lucide-react"
import type { Hotel } from "@/types"
import { createBusSchedule, toggleBusScheduleActive, updateBusSchedule } from "@/app/admin/actions"

type BusScheduleRow = {
  id: string
  hotel_id: string
  hotel_name: string
  departure_time: string
  destination: string
  max_capacity: number
  is_active: boolean
  last_used?: string | null
}

export default function BusSchedulesClient({ rows, hotels }: { rows: BusScheduleRow[]; hotels: Hotel[] }) {
  const [data, setData] = useState(rows)
  const [loading, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<BusScheduleRow | null>(null)
  const [form, setForm] = useState({
    hotelId: hotels[0]?.id ?? "",
    departureTime: "09:00",
    destination: "",
    maxCapacity: 12,
    isActive: true,
  })

  const occupancyHint = useMemo(() => {
    return data.reduce((acc, row) => {
      const key = row.hotel_id
      acc[key] = (acc[key] || 0) + row.max_capacity
      return acc
    }, {} as Record<string, number>)
  }, [data])

  const resetForm = () => {
    setEditing(null)
    setForm({
      hotelId: hotels[0]?.id ?? "",
      departureTime: "09:00",
      destination: "",
      maxCapacity: 12,
      isActive: true,
    })
  }

  const openEdit = (row: BusScheduleRow) => {
    setEditing(row)
    setForm({
      hotelId: row.hotel_id,
      departureTime: row.departure_time,
      destination: row.destination,
      maxCapacity: row.max_capacity,
      isActive: row.is_active,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.hotelId || !form.destination || !form.departureTime) {
      toast.error("Please complete all fields.")
      return
    }
    startTransition(async () => {
      if (editing) {
        const res = await updateBusSchedule({
          id: editing.id,
          hotelId: form.hotelId,
          departureTime: form.departureTime,
          destination: form.destination,
          maxCapacity: Number(form.maxCapacity),
          isActive: form.isActive,
        })
        if (!res.ok) {
          toast.error(res.error ?? "Failed to update schedule")
          return
        }
        toast.success("Template updated")
        setData((prev) =>
          prev.map((r) => (r.id === editing.id ? { ...r, ...form, hotel_name: hotels.find((h) => h.id === form.hotelId)?.name ?? r.hotel_name } : r)),
        )
      } else {
        const res = await createBusSchedule({
          hotelId: form.hotelId,
          departureTime: form.departureTime,
          destination: form.destination,
          maxCapacity: Number(form.maxCapacity),
          isActive: form.isActive,
        })
        if (!res.ok) {
          toast.error(res.error ?? "Failed to create template")
          return
        }
        toast.success("Template created")
        window.location.reload()
      }
      setDialogOpen(false)
      resetForm()
    })
  }

  const handleToggleActive = (row: BusScheduleRow) => {
    startTransition(async () => {
      const res = await toggleBusScheduleActive(row.id, !row.is_active)
      if (!res.ok) {
        toast.error(res.error ?? "Failed to update status")
        return
      }
      setData((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_active: !row.is_active } : r)))
    })
  }

  return (
    <div className="space-y-4">
      <Card className="border-none bg-gradient-to-b from-background to-muted/40 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Bus schedule templates</CardTitle>
            <p className="text-xs text-muted-foreground">Manage default departure time, destination, and capacity per hotel.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                New template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit template" : "New template"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 pt-2">
                <div className="space-y-1.5">
                  <Label>Hotel</Label>
                  <Select value={form.hotelId} onValueChange={(v) => setForm((f) => ({ ...f, hotelId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select hotel" /></SelectTrigger>
                    <SelectContent>
                      {hotels.map((h) => (
                        <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Total template capacity for this hotel: {occupancyHint[form.hotelId] ?? 0} seats.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Departure time</Label>
                    <Input value={form.departureTime} onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={form.maxCapacity}
                      onChange={(e) => setForm((f) => ({ ...f, maxCapacity: Number(e.target.value) }))}
                    />
                    <p className="text-[10px] text-muted-foreground">Safety: cannot lower below current bookings.</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Destination</Label>
                  <Input value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} />
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Active template</p>
                    <p className="text-[11px] text-muted-foreground">Inactive templates won’t generate new daily schedules.</p>
                  </div>
                  <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>Cancel</Button>
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="mr-1.5 h-4 w-4" />
                    {editing ? "Save changes" : "Create template"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Templates</CardTitle>
          <p className="text-xs text-muted-foreground">{data.length} rows</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table className="min-w-full text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">No data</TableCell></TableRow>
                )}
                {data.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.hotel_name}</TableCell>
                    <TableCell className="text-sm">{r.departure_time}</TableCell>
                    <TableCell className="text-sm">{r.destination}</TableCell>
                    <TableCell className="text-sm font-semibold">{r.max_capacity}</TableCell>
                    <TableCell>
                      <Badge variant={r.is_active ? "default" : "secondary"}>
                        {r.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(r)}
                        className={r.is_active ? "" : "border-green-200"}
                      >
                        {r.is_active ? "Disable" : "Enable"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Card className="border border-amber-200 bg-amber-50">
        <CardContent className="flex items-center gap-3 py-3">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
          <div className="text-sm text-amber-700">
            Capacity safety: lowering capacity is blocked if any daily schedule already sold more seats than the new value.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
