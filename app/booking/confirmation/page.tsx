import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, MessageCircle, Copy, Home } from "lucide-react"
import Link from "next/link"
import BookingCode from "@/components/BookingCode"

function ConfirmationContent({ searchParams }: { searchParams: { code?: string } }) {
   const bookingCode = searchParams.code || ''

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Success Icon */}
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Berhasil!</h1>
          <p className="text-gray-600">Tiket Anda telah berhasil dibuat</p>
        </div>

        {/* Booking Code */}
        <BookingCode bookingCode={bookingCode} />

        {/* Instructions */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium">Tiket WhatsApp</p>
                  <p className="text-sm text-gray-600">Tiket akan dikirim ke WhatsApp Anda dalam beberapa menit</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium">Simpan Kode Booking</p>
                  <p className="text-sm text-gray-600">Gunakan kode ini untuk melacak tiket Anda</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium">Tiba 10 Menit Sebelumnya</p>
                  <p className="text-sm text-gray-600">Harap tiba di lobby hotel 10 menit sebelum keberangkatan</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/track" className="w-full">
            <Button variant="outline" className="w-full">
              <MessageCircle className="h-4 w-4 mr-2" />
              Lacak Tiket
            </Button>
          </Link>

          <Link href="/" className="w-full">
            <Button className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmationPage({ searchParams }: { searchParams: { code?: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmationContent searchParams={searchParams} />
    </Suspense>
  )
}
