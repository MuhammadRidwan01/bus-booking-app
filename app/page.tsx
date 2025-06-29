import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { MapPin, Clock, Users, Star, Shield, Phone } from "lucide-react"
import { AnimatedHeader } from "@/components/landing/animated-header"
import { AnimatedHero } from "@/components/landing/animated-hero"

const features = [
  {
    icon: Clock,
    title: "Booking Mudah",
    description: "Proses booking cepat tanpa perlu login",
    color: "blue"
  },
  {
    icon: Users,
    title: "Kapasitas Real-time",
    description: "Cek ketersediaan kursi secara langsung",
    color: "green"
  },
  {
    icon: Phone,
    title: "Tiket di WhatsApp",
    description: "Terima tiket langsung di WhatsApp",
    color: "purple"
  },
  {
    icon: Star,
    title: "Layanan Premium",
    description: "Kenyamanan dan keamanan terjamin",
    color: "yellow"
  },
  {
    icon: Shield,
    title: "Keamanan Prioritas",
    description: "Protokol kesehatan ketat",
    color: "red"
  },
  {
    icon: MapPin,
    title: "Rute Strategis",
    description: "Ke bandara dan pusat perbelanjaan",
    color: "indigo"
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      <AnimatedHeader />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <AnimatedHero />

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <GlassCard
              key={feature.title}
              delay={index * 0.1}
              className="p-6"
            >
              <div className={`bg-${feature.color}-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <feature.icon className={`h-6 w-6 text-${feature.color}-600`} />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </GlassCard>
          ))}
        </div>

        {/* Hotel Selection */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            Pilih Hotel Anda
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Ibis Style */}
            <GlassCard delay={0.5} className="p-6 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">IS</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Ibis Style</h3>
                  <p className="text-sm text-gray-600">Modern & Kontemporer</p>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-3 text-blue-600" />
                  <span>Shuttle ke Bandara & Mall</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-3 text-blue-600" />
                  <span>Jadwal: 06:00 - 22:00</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-3 text-blue-600" />
                  <span>Kapasitas: 15 orang per jadwal</span>
                </div>
              </div>
              <Link href="/booking/ibis-style" className="block">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Booking Sekarang
                </Button>
              </Link>
            </GlassCard>

            {/* Ibis Budget */}
            <GlassCard delay={0.6} className="p-6 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">IB</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Ibis Budget</h3>
                  <p className="text-sm text-gray-600">Ekonomis & Nyaman</p>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-3 text-green-600" />
                  <span>Shuttle ke Bandara & Mall</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-3 text-green-600" />
                  <span>Jadwal: 06:00 - 22:00</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-3 text-green-600" />
                  <span>Kapasitas: 15 orang per jadwal</span>
                </div>
              </div>
              <Link href="/booking/ibis-budget" className="block">
                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  Booking Sekarang
                </Button>
              </Link>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-24 backdrop-blur-md bg-white/80 border-t border-gray-200/80">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Ibis Hotels. Semua hak dilindungi.</p>
            <p className="text-sm mt-2">Layanan shuttle bus eksklusif untuk tamu hotel</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
