import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, MessageCircle, Copy, Home } from "lucide-react"
import Link from "next/link"
import BookingCode from "@/components/BookingCode"

async function ConfirmationContent({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
   const params = await searchParams
   const bookingCode = params.code || ''

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Success Icon */}
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Successful!</h1>
          <p className="text-gray-600">Your ticket has been successfully created</p>
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
                  <p className="font-medium">WhatsApp Ticket</p>
                  <p className="text-sm text-gray-600">Tickets will be sent to your WhatsApp within minutes</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium">Save Booking Code</p>
                  <p className="text-sm text-gray-600">Use this code to track your ticket</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium">Arrived 10 Minutes Earlier</p>
                  <p className="text-sm text-gray-600">Please arrive at the hotel lobby 10 minutes before departure.</p>
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
              Track Ticket
            </Button>
          </Link>

          <Link href="/" className="w-full">
            <Button className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {/* @ts-expect-error Async Server Component */}
      <ConfirmationContent searchParams={searchParams} />
    </Suspense>
  )
}
