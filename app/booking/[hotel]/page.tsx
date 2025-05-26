"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Bus, User, Phone, Users } from "lucide-react"
import Link from "next/link"
import { ScheduleSelector } from "@/components/ScheduleSelector"
import { useRealTimeCapacity } from "@/hooks/useRealTimeCapacity"
import { createBooking } from "@/app/actions/booking"
import { useActionState } from "react"
import { supabase } from "@/lib/supabase"
import type { RoomNumber } from "@/types"

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const hotelSlug = params.hotel as string

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [passengerCount, setPassengerCount] = useState<number>(1)
  const [roomNumbers, setRoomNumbers] = useState<RoomNumber[]>([])
  const [selectedRoomNumberId, setSelectedRoomNumberId] = useState<string>("")

  const { todaySchedules, tomorrowSchedules, loading } = useRealTimeCapacity(hotelSlug)

  const hotelName = hotelSlug === "ibis-style" ? "Ibis Style" : "Ibis Budget"

  useEffect(() => {
    async function fetchRoomNumbers() {
      if (!hotelSlug) return
      const { data: hotel } = await supabase
        .from("hotels")
        .select("id")
        .eq("slug", hotelSlug)
        .single()
      if (!hotel) return
      const { data: rooms } = await supabase
        .from("room_numbers")
        .select("id, room_number, hotel_id, is_active")
        .eq("hotel_id", hotel.id)
        .eq("is_active", true)
      setRoomNumbers(rooms || [])
    }
    fetchRoomNumbers()
  }, [hotelSlug])

  const handleScheduleSelect = (scheduleId: string, date: string) => {
    setSelectedScheduleId(scheduleId)
    setSelectedDate(date)
  }

  const isFormValid = selectedScheduleId && selectedDate && passengerCount >= 1 && selectedRoomNumberId

  async function bookingFormAction(prevState: any, formData: FormData) {
    try {
      await createBooking(formData)
      return { error: null }
    } catch (error: any) {
      return { error: error?.message || "Terjadi kesalahan saat booking" }
    }
  }
  const [state, formAction] = useActionState(bookingFormAction, { error: null })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Bus className="h-6 w-6 text-blue-600" />
              <h1 className="text-lg font-semibold">Booking {hotelName}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Hotel Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    hotelSlug === "ibis-style"
                      ? "bg-gradient-to-br from-blue-500 to-blue-600"
                      : "bg-gradient-to-br from-green-500 to-green-600"
                  }`}
                >
                  <span className="text-white font-bold">{hotelSlug === "ibis-style" ? "IS" : "IB"}</span>
                </div>
                <span>{hotelName}</span>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Schedule Selection */}
          <ScheduleSelector
            todaySchedules={todaySchedules}
            tomorrowSchedules={tomorrowSchedules}
            selectedScheduleId={selectedScheduleId}
            onScheduleSelect={handleScheduleSelect}
            loading={loading}
          />

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Data Penumpang</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createBooking} className="space-y-4">
                {/* Hidden fields */}
                <input type="hidden" name="scheduleId" value={selectedScheduleId || ""} />
                <input type="hidden" name="bookingDate" value={selectedDate} />
                <input type="hidden" name="passengerCount" value={passengerCount} />
                <input type="hidden" name="roomNumberId" value={selectedRoomNumberId} />

                {/* Customer Name */}
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Nama Lengkap</span>
                  </Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    required
                    className="w-full"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Nomor WhatsApp</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    required
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">Tiket akan dikirim ke nomor WhatsApp ini</p>
                </div>

                {/* Passenger Count */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Jumlah Penumpang</span>
                  </Label>
                  <Select
                    value={passengerCount.toString()}
                    onValueChange={(value) => setPassengerCount(Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((count) => (
                        <SelectItem key={count} value={count.toString()}>
                          {count} orang
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Room Number */}
                <div className="space-y-2">
                  <Label htmlFor="roomNumberId" className="flex items-center space-x-2">
                    <span>No. Kamar</span>
                  </Label>
                  <Select
                    value={selectedRoomNumberId}
                    onValueChange={setSelectedRoomNumberId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih nomor kamar" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomNumbers.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.room_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Error Message */}
                {state && typeof state === "object" && "error" in state && state.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{state.error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={!isFormValid}>
                  Konfirmasi Booking
                </Button>

                {!isFormValid && (
                  <p className="text-sm text-gray-500 text-center">Pilih jadwal terlebih dahulu untuk melanjutkan</p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
