import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"]
})

export const metadata: Metadata = {
  title: "Ibis Bus Shuttle - Layanan Shuttle Bus Premium untuk Tamu Hotel",
  description: "Pesan shuttle bus gratis untuk perjalanan Anda di Ibis Hotels. Booking mudah, tracking real-time, dan konfirmasi instan via WhatsApp.",
  keywords: "ibis hotel, shuttle bus, hotel transport, booking shuttle, ibis style, ibis budget",
  openGraph: {
    title: "Ibis Bus Shuttle - Layanan Shuttle Bus Premium",
    description: "Pesan shuttle bus gratis untuk perjalanan Anda di Ibis Hotels",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
