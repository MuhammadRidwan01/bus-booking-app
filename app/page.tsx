import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bus, MapPin, Clock, Users, ArrowRight, CheckCircle } from "lucide-react"

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/ISJA-IBJA-Logo-updated.png" 
                alt="Ibis Hotels Logo"
                className="h-12 w-auto object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Ibis Shuttle Service</h1>
                <p className="text-xs text-gray-500">Jakarta Airport Hotels</p>
              </div>
            </div>
            <Link href="/track">
              <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                Lacak Tiket
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Background Pattern */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 opacity-5"></div>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12 relative">
            <div className="inline-block mb-4">
              <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full">
                Free Shuttle Service
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Booking Shuttle Bus<br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Ibis Hotels Jakarta Airport
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Pesan shuttle bus gratis untuk perjalanan Anda ke bandara. 
              Mudah, cepat, dan tanpa biaya tambahan.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Booking Instan</h3>
              <p className="text-sm text-gray-600">Tanpa login, konfirmasi langsung via WhatsApp</p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Real-time Kapasitas</h3>
              <p className="text-sm text-gray-600">Lihat ketersediaan kursi secara langsung</p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">100% Gratis</h3>
              <p className="text-sm text-gray-600">Layanan shuttle tanpa biaya untuk tamu hotel</p>
            </div>
          </div>

          {/* Hotel Selection */}
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12">Pilih Lokasi Hotel Pick-up Anda</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Ibis Style Card */}
              <Card className="overflow-visible hover:shadow-2xl transition-all duration-300 border-2 hover:border-green-400">
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100">
                  <img 
                    src="/ISJA-depan.jpeg" 
                    alt="Ibis Style Jakarta Airport"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                    <span className="text-green-600 font-bold text-sm">⭐ Style</span>
                  </div>
                </div>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-2xl">
                    <div className="w-14 h-14 flex items-center justify-center shadow-lg">
                      <img 
                        src="/ibis-styles-logo.png" 
                        alt="Ibis Style"
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                    <span>Ibis Style Jakarta Airport</span>
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Hotel modern dengan fasilitas premium dan desain kontemporer yang stylish
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Rute Tersedia</p>
                        <p className="text-sm text-gray-600">Bandara Soekarno-Hatta</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <Clock className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Jadwal Operasional</p>
                        <p className="text-sm text-gray-600">06:00 - 22:00 WIB (Setiap jam)</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <Users className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Kapasitas</p>
                        <p className="text-sm text-gray-600">15 penumpang per shuttle</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-20">
                    <Link href="/booking/ibis-style" className="block w-full">
                      <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 text-base shadow-lg">
                        Booking Sekarang
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Ibis Budget Card */}
              <Card className="overflow-visible hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-400">
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                  <img 
                    src="/IBJA-Depan.jpg" 
                    alt="Ibis Budget Jakarta Airport"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                    <span className="text-blue-600 font-bold text-sm">💰 Budget</span>
                  </div>
                </div>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-2xl">
                    <div className="w-14 h-14 flex items-center justify-center shadow-lg">
                      <img 
                        src="/ibis-budget-logo.png" 
                        alt="Ibis Budget"
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                    <span>Ibis Budget Jakarta Airport</span>
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Hotel ekonomis dengan kualitas terjamin dan harga terjangkau untuk semua
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Rute Tersedia</p>
                        <p className="text-sm text-gray-600">Bandara Soekarno-Hatta</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Jadwal Operasional</p>
                        <p className="text-sm text-gray-600">06:00 - 22:00 WIB (Setiap jam)</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Kapasitas</p>
                        <p className="text-sm text-gray-600">15 penumpang per shuttle</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-20">
                    <Link href="/booking/ibis-budget" className="block w-full">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 text-base shadow-lg">
                        Booking Sekarang
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Info Section */}
          <div className="max-w-4xl mx-auto mt-16 bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <h4 className="text-xl font-bold text-center mb-6">Cara Booking Shuttle</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  1
                </div>
                <p className="text-sm font-semibold mb-1">Pilih Hotel</p>
                <p className="text-xs text-gray-600">Pilih hotel dan tujuan perjalanan Anda</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  2
                </div>
                <p className="text-sm font-semibold mb-1">Isi Data</p>
                <p className="text-xs text-gray-600">Masukkan informasi dan pilih jadwal</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  3
                </div>
                <p className="text-sm font-semibold mb-1">Terima Tiket</p>
                <p className="text-xs text-gray-600">Tiket dikirim langsung ke WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src="/ISJA-IBJA-Logo-updated.png" 
                  alt="Ibis Hotels Logo"
                  className="h-8 w-auto object-contain"
                />
                <span className="font-bold text-lg">Ibis Shuttle Service</span>
              </div>
              <p className="text-gray-400 text-sm">
                Layanan shuttle gratis untuk tamu Ibis Hotels Jakarta Airport
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Kontak</h5>
              <p className="text-gray-400 text-sm mb-2">Ibis Style: +62 21 xxxx xxxx</p>
              <p className="text-gray-400 text-sm">Ibis Budget: +62 21 xxxx xxxx</p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Jam Operasional</h5>
              <p className="text-gray-400 text-sm">Setiap Hari: 06:00 - 22:00 WIB</p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              &copy; 2025 Ibis Hotels Jakarta Airport. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}