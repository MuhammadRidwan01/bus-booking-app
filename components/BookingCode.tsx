"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useState } from "react"

interface BookingCodeProps {
  bookingCode: string
}

export default function BookingCode({ bookingCode }: BookingCodeProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookingCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Booking Code</CardTitle>
      </CardHeader>
    
        <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-mono font-bold text-blue-600 mb-2">{bookingCode}</div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={copyToClipboard}              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>            
              </div>
          </CardContent>
    </Card>
  )
}
