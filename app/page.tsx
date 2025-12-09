import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Bus,
  MapPin,
  Clock,
  Users,
  ArrowRight,
  Shield,
  MessageSquare,
  Sparkles,
  Tag,
  BusIcon,
} from "lucide-react"
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">

          {/* LEFT — BRAND */}
          <div className="flex items-center gap-3 min-w-0">
            <Image
              src="/ISJA-IBJA-Logo-updated.png"
              alt="Ibis Hotels Logo"
              width={180}
              height={50}
              className="h-9 sm:h-10 w-auto shrink-0"
              priority
            />

            <div className=" xs:flex flex-col truncate">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-slate-500 truncate">
                Ibis Jakarta Airport
              </p>
              <h1 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 truncate">
                Shuttle Service
              </h1>
            </div>
          </div>

          {/* RIGHT — BUTTONS */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/track" className="hidden sm:block">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-slate-200 px-4 text-xs sm:text-sm"
              >
                Track Ticket
              </Button>
            </Link>

            <Link href="/booking/ibis-style">
              <Button
                size="sm"
                className="rounded-full shadow-md px-4 text-xs sm:text-sm"
              >
                Book now
              </Button>
            </Link>
          </div>

        </div>
      </header>



      <main className="flex-1">
        {/* HERO */}
        {/* HERO NEW DESKTOP LAYOUT */}
        <section className="relative overflow-hidden" >
          <div className="absolute -z-10 inset-0 bg-gradient-to-br from-blue-600/10 via-sky-500/6 to-emerald-500/10" />
          <div className="absolute -z-10 inset-x-0 top-0 h-40 bg-gradient-to-b from-white via-white/70 to-transparent" />

          <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-5 md:py-20">
            <div className="
      grid 
      grid-cols-1 
      xl:grid-cols-[1.1fr,0.9fr] 
      gap-8 
      xl:gap-12 
      items-start
    ">

              {/* LEFT — TEXT */}
              <div className="space-y-8">
                <div className="
          inline-flex items-center gap-2 
          px-3 py-1 rounded-full 
          bg-white/90 backdrop-blur 
          text-primary text-xs font-semibold 
          border border-white/70 shadow-sm
        ">
                  <BusIcon className="h-4 w-4" />
                  Free shuttle for hotel guests
                </div>

                <h2
                  className="
            font-bold leading-[1.15] text-slate-900 
            text-[clamp(2rem,2vw+1.5rem,3rem)]
            max-w-xl
          "
                >
                  Book your airport shuttle quickly, neatly, and comfortably on any screen
                </h2>

                <p className="text-base md:text-lg text-slate-600 max-w-lg leading-relaxed">
                  Check real time capacity and receive your ticket via WhatsApp. A mobile first UI.
                </p>

                {/* BUTTONS */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <a href="#booking">
                    <Button className="rounded-xl px-6 h-12 shadow-md shadow-primary/20">
                      Start Booking
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </a>

                  <Link href="/track">
                    <Button
                      variant="outline"
                      className="rounded-xl h-12 border-slate-300 px-6"
                    >
                      Track ticket
                    </Button>
                  </Link>
                </div>

                {/* OPERATION HOURS */}
                <div className="
          flex items-center gap-3 
          px-4 py-3 rounded-2xl
          border border-white/70 bg-white/90 backdrop-blur 
          shadow-sm text-sm text-slate-700 w-fit
        ">
                  <Clock className="h-4 w-4 text-primary" />
                  <div className="leading-tight">
                    <p className="font-semibold text-slate-900">06:00 - 22:00 WIB</p>
                    <p className="text-xs text-slate-500">Every hour from the hotel lobby</p>
                  </div>
                </div>
              </div>

              {/* RIGHT — HOTEL SELECT CARD */}
              <div className="relative" >
                <div id="booking" className="absolute -inset-6 rounded-[32px] bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-emerald-500/10 blur-2xl" />

                <Card className="
          relative border bg-white/90 backdrop-blur-xl shadow-xl
          rounded-2xl
        ">
                  <CardHeader className="pb-2 space-y-1">
                    <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                      Start from your hotel
                    </CardDescription>
                    <CardTitle className="text-xl font-semibold text-slate-900">
                      Choose your pickup
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                      Select the hotel where you are staying.
                    </p>
                  </CardHeader>

                  <CardContent className="grid grid-cols-1 gap-4" >
                    <HotelCard
                      name="Ibis Style Jakarta Airport"
                      slug="/booking/ibis-style"
                      image="/ISJA-depan.jpeg"
                      logo="/ibis-styles-logo.png"
                      badge="Style"
                      accent="emerald"
                    />
                    <HotelCard
                      name="Ibis Budget Jakarta Airport"
                      slug="/booking/ibis-budget"
                      image="/IBJA-Depan.jpg"
                      logo="/ibis-budget-logo.png"
                      badge="Budget"
                      accent="indigo"
                    />

                    <div className="
              rounded-xl border bg-slate-50/80 
              px-4 py-3 text-sm flex items-center gap-3
            ">
                      <Shield className="h-4 w-4 text-primary" />
                      Tickets are saved automatically and easy to track.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>


        {/* STEPS */}
        <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
          <Card className="border shadow-md bg-white/50 backdrop-blur-sm">
            <CardHeader className="space-y-2">
              <CardDescription className="text-xs uppercase tracking-[0.28em] text-slate-500">
                How it works
              </CardDescription>
              <CardTitle className="text-xl md:text-2xl text-slate-900">
                Booking in 3 steps
              </CardTitle>
              <p className="text-sm text-slate-600">
                Fast & transparent. Tickets are always ready in your WhatsApp.
              </p>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StepCard number="01" title="Choose hotel" desc="Pick your pickup location." />
              <StepCard number="02" title="Fill details & schedule" desc="Enter info and choose a slot." />
              <StepCard number="03" title="Get your ticket" desc="Ticket sent via WhatsApp with tracking link." />
            </CardContent>
          </Card>
        </section>

        {/* BENEFIT */}
        <section className="container mx-auto px-4 md:px-6 pb-12 md:pb-16 space-y-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-[10px] md:text-xs uppercase tracking-[0.28em] text-slate-500">
                Why choose us
              </p>
              <h3 className="text-xl md:text-2xl font-semibold text-slate-900 mt-2">
                Redesigned for a better experience
              </h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Shield className="h-4 w-4 text-primary" />
              Data stays safe & tickets are auto-saved
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <BenefitCard
              icon={<Bus className="h-5 w-5 text-primary" />}
              title="Short flow"
              desc="3 steps. From choosing a hotel to getting a WhatsApp ticket."
            />
            <BenefitCard
              icon={<Clock className="h-5 w-5 text-primary" />}
              title="Real time capacity"
              desc="See live quotas. Avoid overbooking."
            />
            <BenefitCard
              icon={<Users className="h-5 w-5 text-primary" />}
              title="Comfortable on mobile"
              desc="Compact UI, generous spacing, readable on all devices."
            />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-100 mt-8">
        <div className="container mx-auto px-4 md:px-6 py-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/ISJA-IBJA-Logo-updated.png"
                alt="Ibis Hotels Logo"
                width={160}
                height={44}
                className="h-8 w-auto"
              />
              <div>
                <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-slate-400">
                  Ibis Jakarta Airport
                </p>
                <p className="font-semibold text-slate-50">Shuttle Service</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin className="h-4 w-4" />
              Ibis Style & Budget Jakarta Airport lobbies
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-300">
            <div>
              <p className="font-semibold text-slate-100 mb-2">Contact</p>
              <p>Ibis Style: +62 21 xxxx xxxx</p>
              <p>Ibis Budget: +62 21 xxxx xxxx</p>
            </div>
            <div>
              <p className="font-semibold text-slate-100 mb-2">Operating hours</p>
              <p>Every day 06:00 - 22:00 WIB</p>
            </div>
            <div>
              <p className="font-semibold text-slate-100 mb-2">Help</p>
              <p>Show your WhatsApp ticket when boarding.</p>
              <p>Track tickets on the Track Ticket page.</p>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            {/* &copy; 2025 Ibis Hotels Jakarta Airport. All rights reserved. */}
            &copy; 2025 Muhammad Ridwan. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ------------------------ COMPONENTS ------------------------ */

function FeaturePill({ icon, title, desc }: any) {
  return (
    <div className="rounded-xl border bg-white/90 backdrop-blur p-4 shadow-sm flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        {icon}
        {title}
      </div>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
  )
}

function HotelCard({ name, slug, image, logo, badge, accent = "indigo" }: any) {
  const isEmerald = accent === "emerald"
  const gradient = isEmerald
    ? "from-emerald-500 to-emerald-600"
    : "from-indigo-500 to-indigo-600"

  const pill = isEmerald
    ? "text-emerald-700 border-emerald-100 bg-emerald-50/90"
    : "text-indigo-700 border-indigo-100 bg-indigo-50/90"

  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-white transition hover:shadow-lg hover:-translate-y-1">
      <div className="relative h-40 sm:h-44 md:h-48">
        <Image
          src={image}
          alt={`${name} shuttle cover`}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 544px, (min-width: 768px) 50vw, 100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        <div
          className={`absolute top-3 left-3 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 border ${pill}`}
        >
          <Tag className="h-3.5 w-3.5 text-primary" />
          {badge}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-inner flex items-center justify-center">
            <Image src={logo} alt={`${name} logo`} width={64} height={32} className="h-8 w-auto" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Airport Shuttle</p>
            <h4 className="font-semibold text-slate-900">{name}</h4>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-primary" />
          Soekarno-Hatta Airport
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="h-4 w-4 text-primary" />
          06:00 - 22:00 WIB
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users className="h-4 w-4 text-primary" />
          15 passengers
        </div>

        <Link href={slug}>
          <Button className={`w-full rounded-xl h-11 bg-gradient-to-r ${gradient} text-white shadow-md`}>
            Choose hotel
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

function BenefitCard({ icon, title, desc }: any) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-3 text-sm font-semibold text-slate-900">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        {title}
      </div>
      <p className="text-sm text-slate-600">{desc}</p>
    </div>
  )
}

function StepCard({ number, title, desc }: any) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm flex flex-col gap-2 transition hover:shadow-md hover:-translate-y-0.5">
      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold tracking-[0.28em]">
        {number}
      </div>
      <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
      <p className="text-sm text-slate-600">{desc}</p>
    </div>
  )
}
