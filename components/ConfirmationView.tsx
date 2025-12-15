"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
    CheckCircle,
    Calendar,
    Users,
    User,
    Plane,
    Download,
    Home,
    MessageCircle,
    QrCode,
    Bus,
    RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// Type definition matching the booking_details view + extra fields from API
type BookingDetail = {
    booking_code: string
    customer_name: string
    hotel_name: string
    schedule_date: string
    departure_time: string
    destination: string
    passenger_count: number
    flight_number?: string
    whatsapp_sent: boolean
    whatsapp_attempts: number
    whatsapp_last_error: string | null
    phone: string
    has_whatsapp?: boolean
}

interface ConfirmationViewProps {
    initialBooking: BookingDetail
    bookingCode: string
}

export function ConfirmationView({ initialBooking, bookingCode }: ConfirmationViewProps) {
    const router = useRouter()
    const [booking, setBooking] = useState<BookingDetail>(initialBooking)
    const [downloading, setDownloading] = useState(false)
    const [resending, setResending] = useState(false)

    // Polling logic for WA status
    useEffect(() => {
        if (booking.whatsapp_sent) return // Stop polling if sent

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/booking-status?code=${bookingCode}`)
                const json = await res.json()
                if (json.ok && json.data) {
                    setBooking(prev => ({ ...prev, ...json.data }))
                    if (json.data.whatsapp_sent) {
                        clearInterval(interval)
                    }
                }
            } catch (err) {
                console.error("Polling error", err)
            }
        }, 4000)

        return () => clearInterval(interval)
    }, [bookingCode, booking.whatsapp_sent])

    // Download Handler
    const handleDownload = async () => {
        if (downloading) return
        setDownloading(true)
        try {
            const link = document.createElement('a')
            link.href = `/api/ticket/${bookingCode}`
            link.download = `shuttle-ticket-${bookingCode}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success("Ticket downloading...")
        } catch (e) {
            toast.error("Failed to download ticket")
        } finally {
            setTimeout(() => setDownloading(false), 2000)
        }
    }

    // Resend WA Handler
    const handleResend = async () => {
        setResending(true)
        try {
            const res = await fetch("/api/resend-wa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: bookingCode }),
            })
            const json = await res.json()
            if (json.ok) {
                toast.success("WhatsApp resent successfully")
                // Optimistic update
                setBooking(prev => ({ ...prev, whatsapp_sent: true, whatsapp_last_error: null }))
            } else {
                toast.error(json.error || "Failed to resend")
            }
        } catch (e) {
            toast.error("Network error")
        } finally {
            setResending(false)
        }
    }

    // Derived Display Values
    const formattedDate = booking.schedule_date
        ? format(new Date(booking.schedule_date), "EEE, d MMM yyyy")
        : "Date not set"

    const pickupLocation = booking.hotel_name || "Ibis Hotel"
    const dropoffLocation = booking.destination || "Destination"

    const showResend = !booking.whatsapp_sent && (booking.whatsapp_attempts > 0 || !!booking.whatsapp_last_error)

    return (
        <div className="flex-grow flex flex-col items-center justify-center py-3 px-4 sm:px-6 relative w-full overflow-hidden">

            {/* Soft Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/40 via-transparent to-blue-50/40 -z-20 pointer-events-none" />

            {/* Decorative Background (Nirmana/Gradients) - Enhanced Visibility */}
            <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[700px] h-[700px] bg-green-300/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-[15%] right-[-10%] w-[600px] h-[600px] bg-emerald-200/20 rounded-full blur-[100px]" />
                <div className="absolute -bottom-[20%] left-[10%] w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-[120px]" />
            </div>

            {/* Success Header */}
            <div className="text-center mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full mb-3 shadow-[0_0_30px_-8px_rgba(0,157,94,0.4)]">
                    <CheckCircle className="w-7 h-7 text-[#009D5E]" strokeWidth={3} />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1.5">
                    Booking Confirmed!
                </h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm text-xs mx-auto leading-relaxed">
                    Shuttle successfully booked. Ticket sent to WhatsApp.
                </p>
            </div>

            {/* Main Ticket Card - Enhanced depth and shadow */}
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-300/50 dark:shadow-black/30 border-2 border-slate-200/80 dark:border-slate-700 overflow-hidden relative backdrop-blur-sm">

                {/* Ticket Header - Added backdrop and refined layout */}
                <div className="bg-slate-50/80 dark:bg-slate-800/50 p-4 sm:p-5 border-b border-dashed border-slate-200 dark:border-slate-700 flex justify-between items-start backdrop-blur-md">
                    <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 mb-2">
                            <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5 animate-pulse"></span>
                            Confirmed
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{pickupLocation}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            Booking ID: <span className="font-mono text-slate-700 dark:text-slate-300 select-all">{booking.booking_code}</span>
                        </p>
                    </div>
                    <div className="text-right hidden sm:block">
                        <div className="w-12 h-12 bg-white p-1 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center">
                            <QrCode className="text-slate-900 w-full h-full opacity-90" />
                        </div>
                    </div>
                </div>

                {/* Ticket Body */}
                <div className="p-4 sm:p-5">

                    {/* Route Timeline - Compact */}
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-6">
                        {/* Pickup */}
                        <div className="flex gap-3 items-start w-full md:w-auto min-w-0">
                            <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                                <div className="w-2.5 h-2.5 rounded-full border-[3px] border-slate-300 dark:border-slate-600"></div>
                                <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-700"></div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                                    Pickup • {booking.departure_time?.slice(0, 5)} WIB
                                </p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{pickupLocation}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">Lobby</p>
                            </div>
                        </div>

                        {/* Bus Icon Divider (Desktop) */}
                        <div className="hidden md:flex flex-1 mx-2 items-center justify-center">
                            <div className="h-px w-full bg-slate-100 dark:bg-slate-700/50 relative">
                                <div className="absolute left-1/2 -top-2.5 -ml-2.5 bg-white dark:bg-slate-900 px-1 text-slate-300 dark:text-slate-600">
                                    <Bus className="h-3.5 w-3.5" />
                                </div>
                            </div>
                        </div>

                        {/* Dropoff */}
                        <div className="flex gap-3 items-start w-full md:w-auto min-w-0">
                            <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                                <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-700 md:hidden"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-[#009D5E] ring-4 ring-green-50 dark:ring-green-900/10"></div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                                    Drop off
                                </p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{dropoffLocation}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{dropoffLocation}</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px w-full bg-slate-100 dark:bg-slate-800 mb-5 font-display"></div>

                    {/* Details Grid - Tighter grid */}
                    <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Passenger</label>
                            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-200 font-semibold text-sm">
                                <User className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{booking.customer_name}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Passengers</label>
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-sm">
                                <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                {booking.passenger_count} Person{booking.passenger_count > 1 ? 's' : ''}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Flight No</label>
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-sm">
                                <Plane className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                {booking.flight_number || "-"}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Date</label>
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold text-sm">
                                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                {formattedDate}
                            </div>
                        </div>
                    </div>
                </div>

                {/* WhatsApp Status Footer - Colored background for better visibility */}
                <div className={`px-4 sm:px-5 py-3 flex items-start gap-3 border-t transition-colors ${booking.has_whatsapp === false
                    ? "bg-slate-50/60 dark:bg-slate-800/10 border-slate-100 dark:border-slate-700/30"
                    : booking.whatsapp_sent
                        ? "bg-blue-50/60 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30"
                        : "bg-amber-50/60 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30"
                    }`}>
                    <MessageCircle className={`w-5 h-5 mt-0.5 shrink-0 ${booking.has_whatsapp === false
                        ? "text-slate-400 dark:text-slate-500"
                        : booking.whatsapp_sent
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`} />
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${booking.has_whatsapp === false
                            ? "text-slate-700 dark:text-slate-300"
                            : booking.whatsapp_sent
                                ? "text-blue-900 dark:text-blue-100"
                                : "text-amber-900 dark:text-amber-100"
                            }`}>
                            {booking.has_whatsapp === false
                                ? "No WhatsApp delivery"
                                : booking.whatsapp_sent
                                    ? "Ticket sent via WhatsApp"
                                    : "Sending ticket..."
                            }
                        </p>
                        <p className={`text-xs mt-0.5 leading-relaxed ${booking.has_whatsapp === false
                            ? "text-slate-600 dark:text-slate-400"
                            : booking.whatsapp_sent
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-amber-700 dark:text-amber-300"
                            }`}>
                            {booking.has_whatsapp === false
                                ? "Download your ticket using the button below."
                                : booking.whatsapp_sent
                                    ? `Sent to +${booking.phone}. Show to driver.`
                                    : "Processing digital ticket delivery."
                            }
                        </p>

                        {showResend && booking.has_whatsapp !== false && (
                            <button
                                onClick={handleResend}
                                disabled={resending}
                                className="mt-2 text-xs font-semibold underline decoration-dotted hover:decoration-solid flex items-center gap-1 text-slate-600 dark:text-slate-400"
                            >
                                {resending ? "Resending..." : "Resend WhatsApp"}
                                <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-none transition-all text-sm font-semibold"
                >
                    {downloading ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    {downloading ? 'Downloading...' : 'Download Ticket'}
                </Button>

                <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="flex-1 h-10 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-white rounded-xl text-sm font-semibold"
                >
                    <Home className="mr-2 h-4 w-4" />
                    Home
                </Button>
            </div>

            <button
                onClick={() => router.push("/")}
                className="mt-6 text-xs text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1 transition-colors"
            >
                <span className="text-lg text-[#009D5E]">+</span> Book Another Shuttle
            </button>
        </div>
    )
}
