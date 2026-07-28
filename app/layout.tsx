import type { Metadata } from "next"
import "./globals.css"
import { Plus_Jakarta_Sans, Space_Grotesk, IBM_Plex_Mono } from "next/font/google"

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const fontDisplay = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
})

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono-ibm",
  weight: ["400", "500", "600"],
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
    <html lang="id" className="h-full scroll-smooth">
      <body className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} bg-canvas text-ink antialiased min-h-full`}>
        {children}
      </body>
    </html>
  )
}
