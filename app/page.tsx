import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bus, MapPin, Clock, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bus className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Ibis Bus Shuttle</h1>
            </div>
            <Link href="/track">
              <Button variant="outline" size="sm">
                Lacak Tiket
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Booking Bus Shuttle Ibis Hotels</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pesan shuttle bus gratis untuk perjalanan Anda. Pilih hotel dan jadwal yang sesuai.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Booking Mudah</h3>
            <p className="text-sm text-gray-600">Tanpa perlu login, booking dalam hitungan menit</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Kapasitas Real-time</h3>
            <p className="text-sm text-gray-600">Lihat ketersediaan kursi secara langsung</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Tiket WhatsApp</h3>
            <p className="text-sm text-gray-600">Terima tiket langsung di WhatsApp Anda</p>
          </div>
        </div>

        {/* Hotel Selection */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Pilih Hotel Anda</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ibis Style */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">IS</span>
                  </div>
                  <span>Ibis Style</span>
                </CardTitle>
                <CardDescription>Hotel modern dengan fasilitas lengkap dan desain kontemporer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>Shuttle ke Bandara & Mall</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Jadwal: 06:00 - 22:00</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Kapasitas: 15 orang per jadwal</span>
                  </div>
                </div>
                <Link href="/booking/ibis-style" className="w-full">
                  <Button className="w-full">Booking Sekarang</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Ibis Budget */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">IB</span>
                  </div>
                  <span>Ibis Budget</span>
                </CardTitle>
                <CardDescription>Hotel ekonomis dengan kualitas terjamin dan harga terjangkau</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>Shuttle ke Bandara & Mall</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Jadwal: 06:00 - 22:00</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Kapasitas: 15 orang per jadwal</span>
                  </div>
                </div>
                <Link href="/booking/ibis-budget" className="w-full">
                  <Button className="w-full">Booking Sekarang</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Ibis Hotels. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
