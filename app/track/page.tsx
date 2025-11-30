"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, ArrowLeft, Bus, Calendar, Clock, MapPin, Users, Phone } from "lucide-react"
import Link from "next/link"
import { getBookingByCode } from "@/app/actions/booking"
import type { BookingDetails } from "@/types"
import { formatDate, formatTime } from "@/lib/utils"
import { useSearchParams } from "next/navigation"

export default function TrackPage() {
  const [bookingCode, setBookingCode] = useState("")
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const searchParams = useSearchParams()

  const searchBooking = async (code: string) => {
    if (!code.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const result = await getBookingByCode(code.trim().toUpperCase())
      setBooking(result.found ? result.booking : null)
    } catch (error) {
      console.error("Search error:", error)
      setBooking(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    await searchBooking(bookingCode)
  }

  useEffect(() => {
    const code = searchParams.get("code")
    if (code) {
      setBookingCode(code.toUpperCase())
      searchBooking(code)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Search className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Lacak Tiket
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Search Form */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Search className="h-4 w-4" />
                </div>
                <span>Masukkan Kode Booking</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bookingCode" className="text-base font-medium">Kode Booking</Label>
                  <div className="relative">
                    <Input
                      id="bookingCode"
                      type="text"
                      placeholder="Contoh: IBX1A2B3C4D"
                      value={bookingCode}
                      onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                      className="font-mono text-lg pl-10 h-12 border-2 focus:border-blue-500 transition-all"
                      required
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    <span>Masukkan kode booking yang Anda terima setelah konfirmasi</span>
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Mencari...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
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
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Bus className="h-5 w-5" />
                      </div>
                      <span>Detail Tiket</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Booking Code */}
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 shadow-lg">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                      <div className="relative text-center">
                        <p className="text-sm text-blue-100 mb-2 font-medium">Kode Booking</p>
                        <p className="text-3xl font-mono font-bold text-white tracking-wider">{booking.booking_code}</p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                        <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                        <span>Informasi Penumpang</span>
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                            <Users className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{booking.customer_name}</p>
                            <p className="text-sm text-gray-600">Nama Penumpang</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                            <Phone className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">+{booking.phone}</p>
                            <p className="text-sm text-gray-600">Nomor WhatsApp</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                        <div className="w-1 h-5 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                        <span>Detail Perjalanan</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                            <Bus className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{booking.hotel_name}</p>
                            <p className="text-xs text-blue-600 font-medium">Hotel</p>
                          </div>
                        </div>

                        {booking.room_number && (
                          <div className="flex items-center space-x-3 p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border border-pink-200">
                            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                              <span className="font-bold text-white text-lg">#{booking.room_number}</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-sm">{booking.room_number}</p>
                              <p className="text-xs text-pink-600 font-medium">No. Kamar</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                            <Calendar className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{formatDate(booking.schedule_date)}</p>
                            <p className="text-xs text-green-600 font-medium">Tanggal</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                            <Clock className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{formatTime(booking.departure_time)} WIB</p>
                            <p className="text-xs text-orange-600 font-medium">Keberangkatan</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                            <MapPin className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{booking.destination}</p>
                            <p className="text-xs text-purple-600 font-medium">Tujuan</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                            <Users className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{booking.passenger_count} orang</p>
                            <p className="text-xs text-indigo-600 font-medium">Penumpang</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">Status Tiket:</span>
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${
                            booking.status === "confirmed" 
                              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
                              : "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                          }`}
                        >
                          {booking.status === "confirmed" ? "✓ Terkonfirmasi" : "✕ Dibatalkan"}
                        </span>
                      </div>
                    </div>

                    {/* Instructions */}
                    {booking.status === "confirmed" && (
                      <div className="relative bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-5 overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200/30 rounded-full -mr-12 -mt-12"></div>
                        <div className="relative">
                          <h5 className="font-bold text-amber-900 mb-3 flex items-center space-x-2">
                            <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs">!</span>
                            </div>
                            <span>Petunjuk Keberangkatan</span>
                          </h5>
                          <ul className="space-y-2">
                            <li className="flex items-start space-x-2 text-sm text-amber-800">
                              <span className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">1</span>
                              <span>Tiba di lobby hotel 10 menit sebelum keberangkatan</span>
                            </li>
                            <li className="flex items-start space-x-2 text-sm text-amber-800">
                              <span className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">2</span>
                              <span>Tunjukkan tiket WhatsApp kepada driver</span>
                            </li>
                            <li className="flex items-start space-x-2 text-sm text-amber-800">
                              <span className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">3</span>
                              <span>Pastikan membawa identitas diri</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Search className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Tiket Tidak Ditemukan</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Kode booking yang Anda masukkan tidak ditemukan dalam sistem.
                      </p>
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-5 max-w-md mx-auto">
                        <p className="font-semibold text-gray-900 mb-3">Pastikan:</p>
                        <div className="space-y-2 text-sm text-gray-700">
                          <p className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            <span>Kode booking diketik dengan benar</span>
                          </p>
                          <p className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                            <span>Menggunakan kode yang diterima setelah booking</span>
                          </p>
                          <p className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                            <span>Tidak ada spasi atau karakter tambahan</span>
                          </p>
                        </div>
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
