"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft, MapPin, Clock, Plane, Building2 } from "lucide-react"

interface ServiceTypeSelectorProps {
  selectedServiceType: "drop_off" | "pick_up" | null
  onServiceTypeSelect: (serviceType: "drop_off" | "pick_up") => void
}

export function ServiceTypeSelector({
  selectedServiceType,
  onServiceTypeSelect,
}: ServiceTypeSelectorProps) {
  return (
    <Card className="shadow-lg transition-all duration-300 hover:shadow-xl bg-white/90 border border-slate-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Choose service</p>
            <CardTitle className="text-2xl font-semibold text-slate-900">Travel direction</CardTitle>
          </div>
          <ArrowRight className="h-6 w-6 text-primary" />
        </div>
        <div className="mt-3 text-sm text-blue-900 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
          Select your travel direction to see available schedules.
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {/* Drop-off Service */}
          <button
            type="button"
            className={`w-full text-left rounded-2xl border transition-all duration-200 p-6 bg-white/70 hover:shadow-md hover:-translate-y-[1px] ${
              selectedServiceType === "drop_off" 
                ? "border-primary ring-2 ring-primary/10 bg-primary/5" 
                : "border-slate-200"
            }`}
            onClick={() => onServiceTypeSelect("drop_off")}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <ArrowRight className="h-3 w-3 text-blue-600" />
                  <Plane className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Drop-off Service</h3>
                  {selectedServiceType === "drop_off" && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-slate-600 font-medium">Hotel → Airport</p>
                
                <div className="space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>Depart from hotel lobby</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Available: 03:00 - 00:00 WIB</span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-600 mt-2">
                  Perfect for guests heading to the airport for departure flights.
                </p>
              </div>
            </div>
          </button>

          {/* Pick-up Service */}
          <button
            type="button"
            className={`w-full text-left rounded-2xl border transition-all duration-200 p-6 bg-white/70 hover:shadow-md hover:-translate-y-[1px] ${
              selectedServiceType === "pick_up" 
                ? "border-primary ring-2 ring-primary/10 bg-primary/5" 
                : "border-slate-200"
            }`}
            onClick={() => onServiceTypeSelect("pick_up")}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <div className="flex items-center gap-1">
                  <Plane className="h-4 w-4 text-emerald-600" />
                  <ArrowLeft className="h-3 w-3 text-emerald-600" />
                  <Building2 className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Pick-up Service</h3>
                  {selectedServiceType === "pick_up" && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-slate-600 font-medium">Airport → Hotel</p>
                
                <div className="space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>Pick-up from terminal meeting points</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Available: 13:00 - 00:00 WIB</span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-600 mt-2">
                  Perfect for guests arriving at the airport who need transport to the hotel.
                </p>
              </div>
            </div>
          </button>
        </div>

        {selectedServiceType && (
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Next step</p>
                <p className="text-xs text-slate-600">
                  {selectedServiceType === "drop_off" 
                    ? "Choose your departure time from the hotel"
                    : "Choose your pick-up time and terminal location"
                  }
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="rounded-xl"
                onClick={() => {
                  // Scroll to next section (schedule selector)
                  const scheduleSection = document.querySelector('[data-section="schedule"]')
                  scheduleSection?.scrollIntoView({ behavior: "smooth", block: "start" })
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}