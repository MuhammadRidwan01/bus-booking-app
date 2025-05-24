"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, ArrowLeft, Bus, Calendar, Clock, MapPin, Users, Phone } from "lucide-react"
import Link from "next/link"
import { getBookingByCode } from "@/app/actions/booking"
import type { BookingDetails } from "@/types"
import { formatDate, formatTime } from "@/lib/utils"

export default function TrackPage() {
  const [bookingCode, setBookingCode] = useState("")
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingCode.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const result = await getBookingByCode(bookingCode.trim().toUpperCase())
      setBooking(result.found ? result.booking : null)
    } catch (error) {
      console.error("Search error:", error)
      setBooking(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Search className="h-6 w-6 text-blue-600" />
              <h1 className="text-lg font-semibold">Lacak Tiket</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Search Form */}
          <Card>
            <CardHeader>
              <CardTitle>Masukkan Kode Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bookingCode">Kode Booking</Label>
                  <Input
                    id="bookingCode"
                    type="text"
                    placeholder="Contoh: IBX1A2B3C4D"
                    value={bookingCode}
                    onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                    className="font-mono"
                    required
                  />
                  <p className="text-xs text-gray-500">Masukkan kode booking yang Anda terima setelah konfirmasi</p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Mencari...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Lacak Tiket
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searched && (
            <>
              {booking ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bus className="h-5 w-5 text-blue-600" />
                      <span>Detail Tiket</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Booking Code */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-sm text-blue-600 mb-1">Kode Booking</p>
                        <p className="text-xl font-mono font-bold text-blue-800">{booking.booking_code}</p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{booking.customer_name}</p>
                          <p className="text-sm text-gray-600">Nama Penumpang</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Phone className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">+{booking.phone}</p>
                          <p className="text-sm text-gray-600">Nomor WhatsApp</p>
                        </div>
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-semibold">Detail Perjalanan</h4>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Bus className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{booking.hotel_name}</p>
                            <p className="text-sm text-gray-600">Hotel</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{formatDate(booking.schedule_date)}</p>
                            <p className="text-sm text-gray-600">Tanggal Keberangkatan</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium">{formatTime(booking.departure_time)} WIB</p>
                            <p className="text-sm text-gray-600">Jam Keberangkatan</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{booking.destination}</p>
                            <p className="text-sm text-gray-600">Tujuan</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium">{booking.passenger_count} orang</p>
                            <p className="text-sm text-gray-600">Jumlah Penumpang</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Status:</span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            booking.status === "confirmed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {booking.status === "confirmed" ? "Terkonfirmasi" : "Dibatalkan"}
                        </span>
                      </div>
                    </div>

                    {/* Instructions */}
                    {booking.status === "confirmed" && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h5 className="font-medium text-yellow-800 mb-2">Petunjuk Keberangkatan:</h5>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Tiba di lobby hotel 10 menit sebelum keberangkatan</li>
                          <li>• Tunjukkan tiket WhatsApp kepada driver</li>
                          <li>• Pastikan membawa identitas diri</li>
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Tiket Tidak Ditemukan</h3>
                      <p className="text-gray-600 mb-4">
                        Kode booking yang Anda masukkan tidak ditemukan dalam sistem.
                      </p>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>Pastikan:</p>
                        <p>• Kode booking diketik dengan benar</p>
                        <p>• Menggunakan kode yang diterima setelah booking</p>
                        <p>• Tidak ada spasi atau karakter tambahan</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
