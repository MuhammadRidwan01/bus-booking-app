import type { Metadata } from "next"
import "./globals.css"
import { Plus_Jakarta_Sans } from "next/font/google"

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Ibis Shuttle Booking",
  description: "Book and track Ibis Jakarta Airport shuttle tickets",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className="h-full">
      <body className={`${fontSans.variable} bg-canvas text-ink antialiased min-h-full`}>
        {children}
      </body>
    </html>
  )
}
