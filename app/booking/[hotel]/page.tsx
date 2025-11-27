"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Bus, User, Phone, Users, MapPin, Star, Wifi, Coffee } from "lucide-react"
import Link from "next/link"
import { ScheduleSelector } from "@/components/ScheduleSelector"
import { useRealTimeCapacity } from "@/hooks/useRealTimeCapacity"
import { createBooking } from "@/app/actions/booking"
import { useActionState } from "react"
import { supabase } from "@/lib/supabase"
import type { RoomNumber } from "@/types"
import Image from "next/image"

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const hotelSlug = params.hotel as string

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [passengerCount, setPassengerCount] = useState<number>(1)
  const [roomNumbers, setRoomNumbers] = useState<RoomNumber[]>([])
  const [selectedRoomNumberId, setSelectedRoomNumberId] = useState<string>("")
  const [isMounted, setIsMounted] = useState(false) // Fix hydration

  const { todaySchedules, tomorrowSchedules, loading } = useRealTimeCapacity(hotelSlug)

  const hotelName = hotelSlug === "ibis-style" ? "Ibis Style Jakarta Airport" : "Ibis Budget Jakarta Airport"
  const hotelShortName = hotelSlug === "ibis-style" ? "Ibis Style" : "Ibis Budget"
  
  const hotelImages = {
    "ibis-style": {
      logo: "/ibis-styles-logo.png",
      main: "/ISJA.jpeg",
      photos: ["/ISJA-Depan.jpg", "/ISJA.jpeg", "/ISJA-IBJA-Logo-updated.png"]
    },
    "ibis-budget": {
      logo: "/ibis-budget-logo.png",
      main: "/IBJA-Depan.jpg",
      photos: ["/IBJA-Depan.jpg", "/photo2.jpg", "/Lobby-IBJA.jpg"]
    }
  }

  const currentHotel = hotelImages[hotelSlug as keyof typeof hotelImages]

  // Fix hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

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
    if (isMounted) {
      fetchRoomNumbers()
    }
  }, [hotelSlug, isMounted])

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

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-md sticky top-0 z-10 border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <Bus className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-800">Booking Shuttle</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="overflow-hidden shadow-xl border-0">
            <div className="relative h-64 md:h-80 bg-gradient-to-r from-blue-600 to-blue-800">
              {currentHotel?.main && (
                <Image
                  src={currentHotel.main}
                  alt={hotelName}
                  fill
                  className="object-cover opacity-90"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 mb-2">
                      {currentHotel?.logo && (
                        <div className="w-16 h-16 bg-white rounded-lg p-2 shadow-lg">
                          <Image
                            src={currentHotel.logo}
                            alt={`${hotelShortName} logo`}
                            width={60}
                            height={60}
                            className="object-contain"
                          />
                        </div>
                      )}
                      <div>
                        <h2 className="text-3xl font-bold drop-shadow-lg">{hotelName}</h2>
                        <div className="flex items-center space-x-2 mt-1">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">Jakarta Airport Area</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">Premium</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        <Wifi className="h-4 w-4" />
                        <span className="text-sm">Free WiFi</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        <Coffee className="h-4 w-4" />
                        <span className="text-sm">Breakfast</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50">
              {currentHotel?.photos.slice(0, 3).map((photo, idx) => (
                <div key={idx} className="relative h-24 rounded-lg overflow-hidden group cursor-pointer">
                  <Image
                    src={photo}
                    alt={`${hotelName} photo ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
              ))}
            </div>
          </Card>

          <div className="bg-white rounded-xl shadow-lg p-1">
            <ScheduleSelector
              todaySchedules={todaySchedules}
              tomorrowSchedules={tomorrowSchedules}
              selectedScheduleId={selectedScheduleId}
              onScheduleSelect={handleScheduleSelect}
              loading={loading}
            />
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center space-x-2 text-2xl">
                <User className="h-6 w-6 text-blue-600" />
                <span>Data Penumpang</span>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Mohon lengkapi data di bawah ini untuk menyelesaikan booking
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <form action={formAction} className="space-y-6">
                <input type="hidden" name="scheduleId" value={selectedScheduleId || ""} />
                <input type="hidden" name="bookingDate" value={selectedDate} />
                <input type="hidden" name="passengerCount" value={passengerCount} />
                <input type="hidden" name="roomNumberId" value={selectedRoomNumberId} />

                <div className="space-y-2">
                  <Label htmlFor="customerName" className="flex items-center space-x-2 text-base font-semibold">
                    <User className="h-5 w-5 text-blue-600" />
                    <span>Nama Lengkap</span>
                  </Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    type="text"
                    placeholder="Masukkan nama lengkap sesuai identitas"
                    required
                    className="w-full h-12 text-base border-2 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center space-x-2 text-base font-semibold">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <span>Nomor WhatsApp</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    required
                    className="w-full h-12 text-base border-2 focus:border-blue-500 transition-colors"
                  />
                  <div className="flex items-start space-x-2 bg-blue-50 p-3 rounded-lg">
                    <div className="text-blue-600 mt-0.5">ℹ️</div>
                    <p className="text-sm text-blue-800">
                      Konfirmasi booking dan e-ticket akan dikirim ke nomor WhatsApp ini
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2 text-base font-semibold">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span>Jumlah Penumpang</span>
                    </Label>
                    <Select
                      value={passengerCount.toString()}
                      onValueChange={(value) => setPassengerCount(Number.parseInt(value))}
                    >
                      <SelectTrigger className="h-12 text-base border-2">
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

                  <div className="space-y-2">
                    <Label htmlFor="roomNumberId" className="flex items-center space-x-2 text-base font-semibold">
                      <span>🚪</span>
                      <span>No. Kamar</span>
                    </Label>
                    <Select
                      value={selectedRoomNumberId}
                      onValueChange={setSelectedRoomNumberId}
                      required
                    >
                      <SelectTrigger className="h-12 text-base border-2">
                        <SelectValue placeholder="Pilih nomor kamar" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomNumbers.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Kamar {room.room_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {state && typeof state === "object" && "error" in state && state.error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start space-x-3">
                    <span className="text-red-600 text-xl">⚠️</span>
                    <p className="text-red-800 text-base font-medium">{state.error}</p>
                  </div>
                )}

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300" 
                    disabled={!isFormValid}
                  >
                    {isFormValid ? "✓ Konfirmasi Booking" : "Lengkapi Data Booking"}
                  </Button>

                  {!isFormValid && (
                    <div className="mt-4 text-center bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-800 font-medium">
                        📋 Pilih jadwal dan lengkapi semua data untuk melanjutkan
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                <span>💡</span>
                <span>Informasi Penting</span>
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Harap tiba di lobby 10 menit sebelum jadwal keberangkatan</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>E-ticket akan dikirim melalui WhatsApp setelah booking dikonfirmasi</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Pastikan nomor kamar dan jumlah penumpang sudah benar</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}