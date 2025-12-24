"use client"

import { useEffect, useState, useTransition, useCallback, useMemo } from "react"
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
import { toast } from "sonner"
import { format } from "date-fns"
import { 
  Car, 
  Clock, 
  MapPin, 
  Phone, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Filter,
  Loader2,
  RefreshCw
} from "lucide-react"
import type { BookingDetails, Hotel } from "@/types"
import { fetchBookingsAction } from "@/app/admin/actions"

interface Filters {
  startDate?: string
  endDate?: string
  hotelId?: string
  status?: string
  search?: string
  roomNumber?: string
  flightNumber?: string
  hasSurfboard?: boolean
  hasExcessBaggage?: boolean
}

interface Props {
  initialBookings: BookingDetails[]
  hotels: Hotel[]
  initialFilters: Filters
}

export default function DriverClient({
  initialBookings,
  hotels,
  initialFilters,
}: Props) {
  const [bookings, setBookings] = useState<BookingDetails[]>(initialBookings)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [loading, startTransition] = useTransition()
  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Memoized notification loading function
  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true)
    try {
      const today = format(new Date(), "yyyy-MM-dd")
      const response = await fetch(`/api/driver-notifications?startDate=${today}&endDate=${today}`)
      const result = await response.json()
      
      if (result.ok) {
        setNotifications(result.data || [])
      } else {
        console.error("Failed to load notifications:", result.error)
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setNotificationsLoading(false)
    }
  }, [])

  // Load notifications on component mount
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const syncUrl = useCallback((next: Filters) => {
    const params = new URLSearchParams()
    Object.entries(next).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value))
    })
    router.replace(`/admin/driver?${params.toString()}`)
  }, [router])

  const load = useCallback((nextFilters: Filters) => {
    setFilters(nextFilters)
    syncUrl(nextFilters)
    startTransition(async () => {
      const data = await fetchBookingsAction(nextFilters as any)
      setBookings(data as any)
    })
  }, [syncUrl])

  const handleRefresh = useCallback(async () => {
    load(filters)
    await loadNotifications()
    toast.success("Bookings refreshed")
  }, [load, filters, loadNotifications])

  const acknowledgeNotification = useCallback(async (bookingId: string) => {
    try {
      const response = await fetch('/api/driver-notifications/acknowledge', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          acknowledgedBy: 'driver'
        }),
      })

      const result = await response.json()
      
      if (result.ok) {
        // Reload notifications
        await loadNotifications()
        toast.success("Notification acknowledged")
      } else {
        toast.error("Failed to acknowledge notification")
      }
    } catch (error) {
      console.error("Error acknowledging notification:", error)
      toast.error("Failed to acknowledge notification")
    }
  }, [loadNotifications])

  // Memoized helper functions for better performance
  const hasUnacknowledgedNotifications = useCallback((bookingId: string) => {
    return notifications.some(n => n.booking_id === bookingId && !n.is_acknowledged)
  }, [notifications])

  const isNotificationAcknowledged = useCallback((bookingId: string, type: string) => {
    return notifications.some(n => n.booking_id === bookingId && n.notification_type === type && n.is_acknowledged)
  }, [notifications])

  // Memoized computed values
  const { dropOffBookings, pickUpBookings, specialHandlingCount, unacknowledgedCount } = useMemo(() => {
    const dropOff = bookings.filter(b => (b as any).service_type === 'drop_off')
    const pickUp = bookings.filter(b => (b as any).service_type === 'pick_up')
    const specialCount = notifications.length
    const unackCount = notifications.filter(n => !n.is_acknowledged).length

    return {
      dropOffBookings: dropOff,
      pickUpBookings: pickUp,
      specialHandlingCount: specialCount,
      unacknowledgedCount: unackCount
    }
  }, [bookings, notifications])

  // Memoized filter handlers
  const handleHotelFilter = useCallback((val: string) => {
    load({ ...filters, hotelId: val === "all" ? undefined : val })
  }, [filters, load])

  const handleRoomNumberFilter = useCallback((value: string) => {
    setFilters((f) => ({ ...f, roomNumber: value }))
  }, [])

  const handleRoomNumberBlur = useCallback((value: string) => {
    load({ ...filters, roomNumber: value || undefined })
  }, [filters, load])

  const handleFlightNumberFilter = useCallback((value: string) => {
    setFilters((f) => ({ ...f, flightNumber: value }))
  }, [])

  const handleFlightNumberBlur = useCallback((value: string) => {
    load({ ...filters, flightNumber: value || undefined })
  }, [filters, load])

  const handleSpecialHandlingFilter = useCallback((val: string) => {
    const updates: Partial<Filters> = {}
    if (val === "surfboard") {
      updates.hasSurfboard = true
      updates.hasExcessBaggage = undefined
    } else if (val === "baggage") {
      updates.hasSurfboard = undefined
      updates.hasExcessBaggage = true
    } else {
      updates.hasSurfboard = undefined
      updates.hasExcessBaggage = undefined
    }
    load({ ...filters, ...updates })
  }, [filters, load])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Driver Dashboard</h1>
          <p className="text-muted-foreground">
            Today&apos;s bookings and special handling requirements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || notificationsLoading}
          >
            {(loading || notificationsLoading) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Bookings</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Total Passengers</p>
                <p className="text-2xl font-bold">
                  {bookings.reduce((sum, b) => sum + b.passenger_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Special Handling</p>
                <p className="text-2xl font-bold">{specialHandlingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Unacknowledged</p>
                <p className="text-2xl font-bold">{unacknowledgedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none bg-gradient-to-b from-background to-muted/40 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Filter className="h-4 w-4 text-primary" />
            </span>
            <div>
              <CardTitle className="text-base font-semibold">
                Quick Filters
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Filter bookings for easier management
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Hotel</Label>
            <Select
              value={filters.hotelId ?? "all"}
              onValueChange={handleHotelFilter}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All hotels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hotels</SelectItem>
                {hotels.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Room Number</Label>
            <Input
              placeholder="1205, A12..."
              value={filters.roomNumber ?? ""}
              onChange={(e) => handleRoomNumberFilter(e.target.value)}
              onBlur={(e) => handleRoomNumberBlur(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Flight Number</Label>
            <Input
              placeholder="305, 5A..."
              value={filters.flightNumber ?? ""}
              onChange={(e) => handleFlightNumberFilter(e.target.value)}
              onBlur={(e) => handleFlightNumberBlur(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Special Handling</Label>
            <Select
              value={
                filters.hasSurfboard === true ? "surfboard" :
                filters.hasExcessBaggage === true ? "baggage" :
                "all"
              }
              onValueChange={handleSpecialHandlingFilter}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="surfboard">Surfboards</SelectItem>
                <SelectItem value="baggage">Excess Baggage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drop-off Bookings */}
      {dropOffBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Drop-off Bookings (Hotel → Airport)
              <Badge variant="secondary">{dropOffBookings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Room Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Passengers</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Special Handling</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dropOffBookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-sm">
                        {booking.departure_time}
                      </TableCell>
                      <TableCell>
                        {booking.room_number ? (
                          <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                            Room {booking.room_number}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {booking.customer_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span className="font-mono text-sm">{booking.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {booking.passenger_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {booking.destination}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {booking.has_surfboard && booking.surfboard_count > 0 && (
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={isNotificationAcknowledged(booking.id, 'surfboard') ? "secondary" : "destructive"}
                                className="text-xs"
                              >
                                🏄 {booking.surfboard_count}x Surfboard
                              </Badge>
                              {!isNotificationAcknowledged(booking.id, 'surfboard') && (
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                          )}
                          {booking.excess_baggage_count > 0 && (
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={isNotificationAcknowledged(booking.id, 'excess_baggage') ? "secondary" : "destructive"}
                                className="text-xs"
                              >
                                🧳 +{booking.excess_baggage_count} Baggage
                              </Badge>
                              {!isNotificationAcknowledged(booking.id, 'excess_baggage') && (
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                          )}
                          {!booking.has_surfboard && booking.excess_baggage_count === 0 && (
                            <span className="text-muted-foreground text-xs">Standard</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {hasUnacknowledgedNotifications(booking.id) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeNotification(booking.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Acknowledge
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
      )}

      {/* Pick-up Bookings */}
      {pickUpBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-green-500" />
              Pick-up Bookings (Airport → Hotel)
              <Badge variant="secondary">{pickUpBookings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Flight Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Passengers</TableHead>
                    <TableHead>Terminal</TableHead>
                    <TableHead>Special Handling</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pickUpBookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-sm">
                        {booking.departure_time}
                      </TableCell>
                      <TableCell>
                        {booking.flight_number ? (
                          <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                            {booking.flight_number}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {booking.customer_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span className="font-mono text-sm">{booking.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {booking.passenger_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(booking as any).terminal_code ? (
                          <Badge variant="secondary" className="font-mono">
                            Terminal {(booking as any).terminal_code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {booking.has_surfboard && booking.surfboard_count > 0 && (
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={isNotificationAcknowledged(booking.id, 'surfboard') ? "secondary" : "destructive"}
                                className="text-xs"
                              >
                                🏄 {booking.surfboard_count}x Surfboard
                              </Badge>
                              {!isNotificationAcknowledged(booking.id, 'surfboard') && (
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                          )}
                          {booking.excess_baggage_count > 0 && (
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={isNotificationAcknowledged(booking.id, 'excess_baggage') ? "secondary" : "destructive"}
                                className="text-xs"
                              >
                                🧳 +{booking.excess_baggage_count} Baggage
                              </Badge>
                              {!isNotificationAcknowledged(booking.id, 'excess_baggage') && (
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                          )}
                          {!booking.has_surfboard && booking.excess_baggage_count === 0 && (
                            <span className="text-muted-foreground text-xs">Standard</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {hasUnacknowledgedNotifications(booking.id) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeNotification(booking.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Acknowledge
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
      )}

      {/* No bookings message */}
      {bookings.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No bookings found for today</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}