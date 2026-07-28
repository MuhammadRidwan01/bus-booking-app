"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Download, Home, RefreshCw, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import QRCode from "react-qr-code"

// ── Types ────────────────────────────────────────────
type BookingDetail = {
    booking_code: string
    customer_name: string
    hotel_name: string
    schedule_date: string
    departure_time: string
    destination: string
    passenger_count: number
    flight_number?: string
    room_number?: string
    phone: string
    service_type?: "drop_off" | "pick_up"
    terminal_code?: string
    meeting_point_location?: string
    arrival_time_offset_min?: number
    arrival_time_offset_max?: number
    has_surfboard?: boolean
    surfboard_count?: number
    excess_baggage_count?: number
}

interface ConfirmationViewProps {
    initialBooking: BookingDetail
    bookingCode: string
}

// ── Component ────────────────────────────────────────
export function ConfirmationView({ initialBooking, bookingCode }: ConfirmationViewProps) {
    const router = useRouter()
    const [booking] = useState<BookingDetail>(initialBooking)
    const [downloading, setDownloading] = useState(false)
    const [flipped, setFlipped] = useState(false)
    const [hasInteracted, setHasInteracted] = useState(false)
    const [hintFinished, setHintFinished] = useState(false)
    const [showTooltip, setShowTooltip] = useState(true)
    const [copyToastVisible, setCopyToastVisible] = useState(false)
    const [boardsInLabel, setBoardsInLabel] = useState("")
    const [isDeparted, setIsDeparted] = useState(false)

    // ── Derived Display Values ──
    const formattedDate = booking.schedule_date
        ? format(new Date(booking.schedule_date), "EEE, d MMM yyyy")
        : "Date not set"

    const departureTimeShort = booking.departure_time?.slice(0, 5) || "—"

    const pickupLocation = booking.service_type === "pick_up"
        ? (booking.terminal_code ? `Terminal ${booking.terminal_code}` : "Airport Terminal")
        : (booking.hotel_name || "Ibis Hotel")

    const pickupSub = booking.service_type === "pick_up"
        ? (booking.meeting_point_location || "Meeting point")
        : "Hotel Lobby"

    const dropoffLocation = booking.service_type === "pick_up"
        ? (booking.hotel_name || "Ibis Hotel")
        : (booking.destination || "Airport")

    const dropoffSub = booking.service_type === "pick_up"
        ? "Hotel Lobby"
        : "Terminal drop-off"

    const serviceTypeLabel = booking.service_type === "pick_up"
        ? "Pick-up service"
        : "Drop-off service"

    const serviceDirection = booking.service_type === "pick_up"
        ? "Airport shuttle · Pick-up service"
        : "Airport shuttle · Drop-off service"

    const pickupLabel = booking.service_type === "pick_up" ? "Airport" : "Hotel"
    const dropoffLabel = booking.service_type === "pick_up" ? "Hotel" : "Airport"

    // ── Countdown Timer ──
    const updateCountdown = useCallback(() => {
        if (!booking.schedule_date || !booking.departure_time) return
        const [h, m] = booking.departure_time.split(":").map(Number)
        const target = new Date(booking.schedule_date)
        target.setHours(h, m, 0, 0)

        const now = new Date()
        const diffMs = target.getTime() - now.getTime()

        if (diffMs > 0) {
            const diffMin = Math.round(diffMs / 60000)
            const hours = Math.floor(diffMin / 60)
            const mins = diffMin % 60
            setBoardsInLabel(hours > 0 ? `Boards in ${hours}h ${mins}m` : `Boards in ${mins}m`)
            setIsDeparted(false)
        } else {
            setBoardsInLabel("Shuttle has departed")
            setIsDeparted(true)
        }
    }, [booking.schedule_date, booking.departure_time])

    useEffect(() => {
        updateCountdown()
        const interval = setInterval(updateCountdown, 30000)
        return () => clearInterval(interval)
    }, [updateCountdown])

    // ── Handlers ──
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
        } catch {
            toast.error("Failed to download ticket")
        } finally {
            setTimeout(() => setDownloading(false), 2000)
        }
    }

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation()
        const copy = () => {
            setCopyToastVisible(true)
            setTimeout(() => setCopyToastVisible(false), 1600)
        }
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(booking.booking_code).then(copy).catch(copy)
        } else {
            copy()
        }
    }

    const toggleFlip = () => {
        setHasInteracted(true)
        setShowTooltip(false)
        setFlipped(prev => !prev)
    }

    const isHintActive = !hasInteracted && !hintFinished && !flipped

    // ── Build detail rows ──
    const detailRows: { label: string; value: string }[] = [
        { label: "Passenger", value: booking.customer_name },
        {
            label: booking.service_type === "pick_up" ? "Flight no." : "Room no.",
            value: (booking.service_type === "pick_up" ? booking.flight_number : booking.room_number) || "—"
        },
        { label: "Date", value: formattedDate },
        { label: "Passengers", value: `${booking.passenger_count} person${booking.passenger_count > 1 ? 's' : ''}` },
    ]

    // Conditional: Terminal info (pick_up only)
    if (booking.service_type === "pick_up" && booking.terminal_code) {
        detailRows.push({ label: "Terminal", value: `Terminal ${booking.terminal_code}` })
    }
    if (booking.service_type === "pick_up" && booking.arrival_time_offset_min && booking.arrival_time_offset_max) {
        detailRows.push({ label: "Pickup window", value: `+${booking.arrival_time_offset_min}-${booking.arrival_time_offset_max}min` })
    }

    // Conditional: Surfboards
    if (booking.has_surfboard && booking.surfboard_count) {
        detailRows.push({ label: "Surfboards", value: `${booking.surfboard_count} board${booking.surfboard_count !== 1 ? 's' : ''}` })
    }

    // Conditional: Excess baggage
    if ((booking.excess_baggage_count ?? 0) > 0) {
        detailRows.push({ label: "Excess baggage", value: `${booking.excess_baggage_count} item${booking.excess_baggage_count !== 1 ? 's' : ''}` })
    }

    // ── Phone/email for contact ──
    const hotelPhone = booking.hotel_name?.toLowerCase().includes('budget')
        ? '+62 21 2933 7888'
        : '+62 21 2932 7777'

    return (
        <div className="flex-grow flex flex-col items-center justify-center pt-14 pb-8 px-4 sm:px-6 relative w-full overflow-x-hidden">

            {/* ── Dark void background with grid ── */}
            <div className="absolute inset-0 -z-20 pointer-events-none" style={{
                background: `var(--sp-void)`,
                backgroundImage: `
                    radial-gradient(circle at 50% 0%, rgba(255,255,255,0.04), transparent 60%),
                    repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 48px),
                    repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 48px)
                `
            }} />



            {/* ═══ CONTENT WRAPPER ═══ */}
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-16 w-full max-w-5xl mx-auto">
                
                {/* ── Left Column: Ticket ── */}
                <div className="flex flex-col items-center w-full max-w-[400px]">

            {/* ═══ SHUTTLE PASS CARD ═══ */}
            <div className="w-full shuttle-pass-perspective relative mt-2">
                {showTooltip && (
                    <div className="shuttle-pass-tooltip-hint">
                        Tap kartu ini untuk lihat QR & detail lain
                    </div>
                )}
                <div
                    className={`shuttle-pass-card ${flipped ? 'flipped' : ''} ${isHintActive ? 'hint-active' : ''}`}
                    onClick={toggleFlip}
                    onAnimationEnd={(e) => {
                        if (e.animationName === 'sp-press-hint') {
                            setHintFinished(true)
                        }
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFlip() } }}
                    tabIndex={0}
                    role="button"
                    aria-pressed={flipped}
                    aria-label="Shuttle pass, tap to flip and see QR code"
                >
                    {/* ────────── FACE FRONT ────────── */}
                    <div className="shuttle-pass-face">
                        {/* Status Row */}
                        <div className="flex items-center justify-end" style={{ padding: '18px 22px 0' }}>
                            <div className="flex items-center gap-1.5" style={{
                                fontFamily: 'var(--font-mono-ibm), monospace',
                                fontSize: '10.5px',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                padding: '5px 10px 5px 8px',
                                borderRadius: '100px',
                                background: isDeparted ? '#E7E1D2' : 'var(--sp-transit-bg)',
                                color: isDeparted ? 'var(--sp-ink-soft)' : 'var(--sp-transit-dark)',
                            }}>
                                <span style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: isDeparted ? 'var(--sp-ink-faint)' : 'var(--sp-transit)',
                                    display: 'inline-block',
                                }} />
                                <span>{isDeparted ? 'Departed' : 'Confirmed'}</span>
                            </div>
                        </div>

                        {/* Brand */}
                        <div style={{ padding: '14px 22px 0' }}>
                            <h2 style={{
                                margin: 0,
                                fontFamily: 'var(--font-display), sans-serif',
                                fontWeight: 700,
                                fontSize: '22px',
                                letterSpacing: '-0.01em',
                                color: 'var(--sp-ink)',
                            }}>{booking.hotel_name}</h2>
                            <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--sp-ink-soft)' }}>
                                {serviceDirection}
                            </p>
                        </div>

                        {/* Route */}
                        <div className="flex items-start justify-between" style={{ padding: '22px 22px 6px', gap: 10 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontFamily: 'var(--font-mono-ibm), monospace', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--sp-ink-faint)', textTransform: 'uppercase', margin: '0 0 4px' }}>
                                    {pickupLabel}
                                </p>
                                <p style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: '14.5px', lineHeight: 1.25, margin: 0, color: 'var(--sp-ink)' }}>
                                    {pickupLocation}
                                </p>
                                <p style={{ fontSize: '11.5px', color: 'var(--sp-ink-soft)', margin: '2px 0 0' }}>
                                    {pickupSub}
                                </p>
                            </div>
                            <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                                <p style={{ fontFamily: 'var(--font-mono-ibm), monospace', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--sp-ink-faint)', textTransform: 'uppercase', margin: '0 0 4px' }}>
                                    {dropoffLabel}
                                </p>
                                <p style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: '14.5px', lineHeight: 1.25, margin: 0, color: 'var(--sp-ink)' }}>
                                    {dropoffLocation}
                                </p>
                                <p style={{ fontSize: '11.5px', color: 'var(--sp-ink-soft)', margin: '2px 0 0' }}>
                                    {dropoffSub}
                                </p>
                            </div>
                        </div>

                        {/* Track */}
                        <div style={{ position: 'relative', height: 20, margin: '8px 22px 4px' }}>
                            <div style={{ position: 'absolute', top: '50%', left: 6, right: 6, borderTop: '1.5px dashed var(--sp-ink-faint)', transform: 'translateY(-50%)' }} />
                            <div style={{ position: 'absolute', top: '50%', left: 0, width: 7, height: 7, borderRadius: '50%', background: 'var(--sp-transit)', transform: 'translateY(-50%)' }} />
                            <div className="shuttle-pass-vehicle" style={{
                                position: 'absolute', top: '50%', width: 16, height: 10, left: '6%', opacity: 0,
                                transform: 'translate(-50%,-50%)',
                            }}>
                                <svg viewBox="0 0 24 14" fill="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                                    <rect x="1" y="2" width="18" height="8" rx="2" fill="#182231" />
                                    <rect x="4" y="4" width="4" height="3.5" fill="#F4EDDD" />
                                    <rect x="9.5" y="4" width="4" height="3.5" fill="#F4EDDD" />
                                    <rect x="15" y="4" width="3" height="3.5" fill="#F4EDDD" />
                                    <circle cx="6" cy="11" r="2" fill="#182231" />
                                    <circle cx="15" cy="11" r="2" fill="#182231" />
                                </svg>
                            </div>
                            <div style={{ position: 'absolute', top: '50%', right: 0, width: 7, height: 7, borderRadius: '50%', background: 'var(--sp-ink)', transform: 'translateY(-50%)' }} />
                        </div>

                        {/* Depart Row */}
                        <div className="flex items-baseline justify-between" style={{ padding: '10px 22px 20px', borderBottom: '1px dashed var(--sp-line)' }}>
                            <p style={{
                                fontFamily: 'var(--font-mono-ibm), monospace',
                                fontSize: '19px',
                                fontWeight: 600,
                                letterSpacing: '0.01em',
                                margin: 0,
                                color: 'var(--sp-ink)',
                            }}>
                                {departureTimeShort}
                                <span style={{ fontSize: '11px', color: 'var(--sp-ink-faint)', fontWeight: 400, marginLeft: '4px' }}>WIB</span>
                            </p>
                            <p style={{
                                fontFamily: 'var(--font-mono-ibm), monospace',
                                fontSize: '11.5px',
                                color: isDeparted ? 'var(--sp-ink-faint)' : 'var(--sp-transit-dark)',
                                margin: 0,
                            }}>
                                {boardsInLabel}
                            </p>
                        </div>

                        {/* Notch Row */}
                        <div style={{ position: 'relative', height: 0 }}>
                            <div style={{ position: 'absolute', top: -11, left: -11, width: 22, height: 22, borderRadius: '50%', background: 'var(--sp-void)' }} />
                            <div style={{ position: 'absolute', top: -11, right: -11, width: 22, height: 22, borderRadius: '50%', background: 'var(--sp-void)' }} />
                        </div>

                        {/* Details Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px 12px',
                            padding: '22px 22px 6px',
                        }}>
                            {detailRows.map((row, i) => (
                                <div key={i}>
                                    <p style={{
                                        fontFamily: 'var(--font-mono-ibm), monospace',
                                        fontSize: '9.5px',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        color: 'var(--sp-ink-faint)',
                                        margin: '0 0 4px',
                                    }}>{row.label}</p>
                                    <p style={{
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        margin: 0,
                                        textTransform: 'capitalize',
                                        color: 'var(--sp-ink)',
                                    }}>{row.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Stamp */}
                        <div
                            className={`shuttle-pass-stamp ${isDeparted ? 'is-departed' : ''}`}
                            style={{ fontFamily: 'var(--font-display), sans-serif' }}
                        >
                            {isDeparted ? 'Departed' : 'Confirmed'}
                        </div>

                        {/* Stub Footer */}
                        <div className="flex items-center justify-between" style={{ gap: 14, padding: '16px 22px 20px' }}>
                            {/* Mini QR */}
                            <div style={{
                                width: 52, height: 52, borderRadius: 8,
                                background: 'var(--sp-void)', flexShrink: 0, padding: 5,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <QRCode value={booking.booking_code} size={42} bgColor="var(--sp-void)" fgColor="var(--sp-paper)" />
                            </div>
                            {/* Booking ID */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                    fontFamily: 'var(--font-mono-ibm), monospace',
                                    fontSize: '9.5px',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color: 'var(--sp-ink-faint)',
                                    margin: '0 0 4px',
                                }}>Booking ID</p>
                                <div className="flex items-center gap-1.5">
                                    <span style={{
                                        fontFamily: 'var(--font-mono-ibm), monospace',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        letterSpacing: '0.02em',
                                        color: 'var(--sp-ink)',
                                    }}>{booking.booking_code}</span>
                                    <button
                                        onClick={handleCopy}
                                        aria-label="Copy booking ID"
                                        style={{
                                            border: 'none', background: 'transparent',
                                            color: 'var(--sp-ink-faint)', cursor: 'pointer',
                                            padding: 4, display: 'inline-flex', borderRadius: 6,
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sp-paper-2)'; e.currentTarget.style.color = 'var(--sp-ink)' }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sp-ink-faint)' }}
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            {/* Flip Hint */}
                            <div className="flex items-center gap-1" style={{ fontSize: '11px', color: 'var(--sp-ink-faint)', whiteSpace: 'nowrap' }}>
                                <span>Flip</span>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                    <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* ────────── FACE BACK ────────── */}
                    <div className="shuttle-pass-face shuttle-pass-face-back">
                        {/* Back Header */}
                        <div className="flex items-center justify-between" style={{ padding: '20px 22px 0' }}>
                            <div>
                                <span style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 600, fontSize: '14px', color: 'var(--sp-ink)' }}>
                                    {booking.hotel_name}
                                </span>
                                <span style={{
                                    display: 'block',
                                    fontFamily: 'var(--font-mono-ibm), monospace',
                                    fontWeight: 400,
                                    fontSize: '10px',
                                    letterSpacing: '0.1em',
                                    color: 'var(--sp-ink-faint)',
                                    textTransform: 'uppercase',
                                    marginTop: 2,
                                }}>Booking {booking.booking_code}</span>
                            </div>
                        </div>

                        {/* Big QR */}
                        <div className="flex flex-col items-center" style={{ padding: '22px 22px 6px' }}>
                            <div style={{
                                width: 168, height: 168,
                                background: 'var(--sp-void)',
                                borderRadius: 14, padding: 12,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <QRCode value={booking.booking_code} size={144} bgColor="var(--sp-void-2)" fgColor="var(--sp-paper)" />
                            </div>
                            <p style={{
                                fontFamily: 'var(--font-mono-ibm), monospace',
                                fontSize: '11px',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: 'var(--sp-ink-soft)',
                                margin: '14px 0 0',
                            }}>Scan to verify ticket</p>
                            <p style={{
                                fontSize: '12px',
                                color: 'var(--sp-ink-faint)',
                                textAlign: 'center',
                                maxWidth: 260,
                                margin: '6px 0 0',
                                lineHeight: 1.5,
                            }}>
                                Show this QR code or your downloaded PDF ticket to the driver upon boarding.
                            </p>
                        </div>

                        {/* Divider */}
                        <div style={{ margin: '20px 22px 0', borderTop: '1px dashed var(--sp-line)' }} />

                        {/* Contact */}
                        <div style={{ padding: '16px 22px 20px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 12px', color: 'var(--sp-ink)' }}>
                                Need help? Contact {booking.hotel_name}
                            </p>

                            <a href={`tel:${hotelPhone.replace(/\s/g, '')}`} className="flex items-center gap-2.5" style={{ padding: '7px 0', textDecoration: 'none', color: 'var(--sp-ink)' }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--sp-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                                <span>
                                    <span style={{ fontSize: '9.5px', color: 'var(--sp-ink-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', fontFamily: 'var(--font-mono-ibm), monospace' }}>Phone / WhatsApp</span>
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{hotelPhone}</span>
                                </span>
                            </a>

                            <a href="mailto:H8593-RE@accor.com" className="flex items-center gap-2.5" style={{ padding: '7px 0', textDecoration: 'none', color: 'var(--sp-ink)' }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--sp-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                    <path d="M22 6c0-1.1-.9-2-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2V6z" />
                                    <path d="M22 6l-10 7L2 6" />
                                </svg>
                                <span>
                                    <span style={{ fontSize: '9.5px', color: 'var(--sp-ink-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', fontFamily: 'var(--font-mono-ibm), monospace' }}>Email</span>
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>H8593-RE@accor.com</span>
                                </span>
                            </a>

                            <div className="flex items-center gap-2.5" style={{ padding: '7px 0', color: 'var(--sp-ink)' }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--sp-ink-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                    <path d="M21 8V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9m5-16h-5v4h5V6z" />
                                    <path d="M17 12H7" /><path d="M17 16H7" />
                                </svg>
                                <span>
                                    <span style={{ fontSize: '9.5px', color: 'var(--sp-ink-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', fontFamily: 'var(--font-mono-ibm), monospace' }}>Fax</span>
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>+62 21 2923 7637</span>
                                </span>
                            </div>
                        </div>

                        {/* Flip back hint */}
                        <div className="flex items-center justify-center gap-1.5" style={{ padding: '0 22px 20px', fontSize: '11px', color: 'var(--sp-ink-faint)' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                            </svg>
                            <span>Tap to flip back</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stage Hint */}
            <p className="mt-4" style={{
                fontFamily: 'var(--font-mono-ibm), monospace',
                fontSize: '11px',
                letterSpacing: '0.08em',
                color: 'rgba(244,237,221,0.45)',
                textTransform: 'uppercase',
            }}>
                Tap the pass to flip
            </p>
                </div>

                {/* ── Right Column: Info & Actions ── */}
                <div className="flex flex-col w-full max-w-[400px] lg:mt-4">

            {/* ── Meeting Point Instructions (pick_up only) ── */}
            {booking.service_type === "pick_up" && booking.meeting_point_location && (
                <div className="w-full mt-4 lg:mt-0 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ background: 'var(--sp-transit-bg)' }}>
                    <div className="flex items-start gap-3" style={{ padding: '16px 20px' }}>
                        <MapPin className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--sp-transit)' }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold mb-1" style={{ color: 'var(--sp-transit-dark)' }}>
                                Meeting Point Instructions
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--sp-transit-dark)' }}>
                                <span className="font-semibold">Location:</span> {booking.meeting_point_location}
                            </p>
                            {booking.arrival_time_offset_min && booking.arrival_time_offset_max && (
                                <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--sp-transit-dark)' }}>
                                    <span className="font-semibold">Pickup Window:</span> {booking.arrival_time_offset_min}-{booking.arrival_time_offset_max} minutes after departure time
                                </p>
                            )}
                            <p className="text-xs mt-2 italic" style={{ color: 'var(--sp-transit)' }}>
                                Look for the hotel shuttle sign and show this ticket to the driver.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Action Buttons ── */}
            <div className="mt-5 flex flex-col sm:flex-row gap-3 w-full">
                <Button
                    onClick={(e) => { e.stopPropagation(); handleDownload() }}
                    disabled={downloading}
                    className="flex-1 h-10 rounded-xl shadow-lg text-sm font-semibold transition-all"
                    style={{
                        background: 'var(--sp-ink)',
                        color: 'var(--sp-paper)',
                        border: 'none',
                    }}
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
                    onClick={(e) => { e.stopPropagation(); router.push("/") }}
                    className="flex-1 h-10 rounded-xl text-sm font-semibold transition-all"
                    style={{
                        background: 'transparent',
                        color: 'var(--sp-ink)',
                        borderColor: 'rgba(26, 24, 20, 0.2)',
                    }}
                >
                    <Home className="mr-2 h-4 w-4" />
                    Home
                </Button>
            </div>

            <button
                onClick={() => router.push("/")}
                className="mt-6 text-xs font-medium flex items-center justify-center lg:justify-start gap-1 transition-colors self-center lg:self-start"
                style={{ color: 'var(--sp-ink-faint)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--sp-paper)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sp-ink-faint)'}
            >
                <span className="text-lg" style={{ color: 'var(--sp-transit)' }}>+</span> Book Another Shuttle
            </button>
                </div>
            </div>

            {/* Copy Toast */}
            <div className={`shuttle-pass-toast ${copyToastVisible ? 'show' : ''}`} style={{ fontFamily: 'var(--font-mono-ibm), monospace' }}>
                Booking ID copied
            </div>
        </div>
    )
}
