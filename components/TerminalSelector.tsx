"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Clock, Plane, Info } from "lucide-react"
import type { TerminalMeetingPoint } from "@/types"

interface TerminalSelectorProps {
  terminalMeetingPoints: TerminalMeetingPoint[]
  selectedTerminalCode: string | null
  selectedMeetingPointId: string | null
  onTerminalSelect: (terminalCode: string, meetingPointId: string) => void
  loading?: boolean
  serviceType?: "drop_off" | "pick_up" | null
  isOptional?: boolean
}

export function TerminalSelector({
  terminalMeetingPoints,
  selectedTerminalCode,
  selectedMeetingPointId,
  onTerminalSelect,
  loading = false,
  serviceType = "pick_up",
  isOptional = false,
}: TerminalSelectorProps) {
  if (loading) {
    return (
      <Card className="shadow-lg transition-all duration-300 hover:shadow-xl bg-white/90 border border-slate-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Terminal selection</p>
              <CardTitle className="text-2xl font-semibold text-slate-900">Loading terminals...</CardTitle>
            </div>
            <Plane className="h-6 w-6 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg transition-all duration-300 hover:shadow-xl bg-white/90 border border-slate-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Terminal selection</p>
            <CardTitle className="text-2xl font-semibold text-slate-900">
              {serviceType === "drop_off" ? "Destination terminal" : "Choose your terminal"}
              {isOptional && <span className="text-lg text-slate-500 ml-2">(Optional)</span>}
            </CardTitle>
          </div>
          <Plane className="h-6 w-6 text-primary" />
        </div>
        <div className={`mt-3 text-sm rounded-xl px-4 py-3 border ${
          serviceType === "drop_off" 
            ? "text-blue-900 bg-blue-50 border-blue-100" 
            : "text-emerald-900 bg-emerald-50 border-emerald-100"
        }`}>
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">
                {serviceType === "drop_off" 
                  ? "Drop-off Information" 
                  : "Airport Pick-up Instructions"
                }
              </p>
              <p className="text-xs mt-1">
                {serviceType === "drop_off"
                  ? "Optional: Let us know which terminal you're heading to. This helps our driver provide better service."
                  : "Select your arrival terminal. Our driver will meet you at the designated pick-up point."
                }
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {serviceType === "drop_off" ? (
          /* Dropdown for drop-off service */
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-900 mb-2 block">
                Destination Terminal (Optional)
              </label>
              <Select 
                value={selectedTerminalCode || "none"} 
                onValueChange={(value) => {
                  if (value === "none") {
                    onTerminalSelect("", "")
                  } else {
                    const terminal = terminalMeetingPoints.find(t => t.terminalCode === value)
                    if (terminal) {
                      onTerminalSelect(terminal.terminalCode, terminal.id)
                    }
                  }
                }}
              >
                <SelectTrigger className="w-full h-12 rounded-xl">
                  <SelectValue placeholder="Select terminal (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">No terminal specified</span>
                    </div>
                  </SelectItem>
                  {terminalMeetingPoints.map((terminal) => (
                    <SelectItem key={terminal.id} value={terminal.terminalCode}>
                      <div className="flex items-center gap-3">
                        <Plane className="h-4 w-4 text-blue-600" />
                        <div>
                          <span className="font-medium">Terminal {terminal.terminalCode}</span>
                          <span className="text-xs text-slate-500 ml-2">
                            ({terminal.terminalCode.includes('3') ? 'Domestic' : 'International'})
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTerminalCode && selectedTerminalCode !== "none" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Plane className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1">
                      Terminal {selectedTerminalCode}
                    </h4>
                    <p className="text-sm text-blue-800">
                      {(() => {
                        const terminal = terminalMeetingPoints.find(t => t.terminalCode === selectedTerminalCode)
                        return terminal 
                          ? `We'll drop you off at Terminal ${terminal.terminalCode}. ${
                              terminal.terminalCode === '3' 
                                ? "Domestic flights terminal." 
                                : "International flights terminal."
                            }`
                          : ""
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedTerminalCode && selectedTerminalCode !== "none" ? "Destination Terminal Selected" : "No Terminal Specified"}
                  </p>
                  <p className="text-xs text-slate-600">
                    {selectedTerminalCode && selectedTerminalCode !== "none"
                      ? `Terminal ${selectedTerminalCode} - Ready to proceed with booking`
                      : "You can proceed without selecting a terminal"
                    }
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => {
                    const formSection = document.querySelector('[data-section="form"]')
                    formSection?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Card selection for pick-up service */
          <>
            {terminalMeetingPoints.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <MapPin className="h-10 w-10 mx-auto mb-3 text-slate-400" />
                <p className="font-semibold text-slate-800">No terminals available</p>
                <p className="text-sm text-slate-600">Terminal information is currently unavailable.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {terminalMeetingPoints.map((terminal) => {
                  const isSelected = selectedTerminalCode === terminal.terminalCode && 
                                    selectedMeetingPointId === terminal.id

                  return (
                    <button
                      key={terminal.id}
                      type="button"
                      className={`w-full text-left rounded-2xl border transition-all duration-200 p-4 bg-white/70 hover:shadow-md hover:-translate-y-[1px] ${
                        isSelected 
                          ? "border-primary ring-2 ring-primary/10 bg-primary/5" 
                          : "border-slate-200"
                      }`}
                      onClick={() => onTerminalSelect(terminal.terminalCode, terminal.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <Plane className="h-6 w-6 text-emerald-600" />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-slate-900">
                                Terminal {terminal.terminalCode}
                              </h3>
                              <Badge variant="outline" className="bg-white text-slate-600 border-slate-200">
                                {terminal.terminalCode.includes('3') ? 'Domestic' : 'International'}
                              </Badge>
                            </div>
                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              </div>
                            )}
                          </div>

                          <div className="flex items-start gap-2 text-sm text-slate-700">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                            <span className="font-medium">{terminal.locationDescription}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span>
                              Pick-up window: {terminal.arrivalTimeOffsetMin}-{terminal.arrivalTimeOffsetMax} minutes after departure
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2 mt-2">
                            <p className="font-medium text-slate-700 mb-1">Meeting Instructions:</p>
                            <p>
                              {terminal.terminalCode === '3' 
                                ? "Look for our driver at the East Lobby, in front of the domestic parking building."
                                : "Find our driver at the 2nd floor arrival pick-up point. Look for the hotel shuttle sign."
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {selectedTerminalCode && selectedMeetingPointId && (
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Arrival Terminal</p>
                    <p className="text-xs text-slate-600">
                      Terminal {selectedTerminalCode} - Ready to proceed with booking
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-xl"
                    onClick={() => {
                      const formSection = document.querySelector('[data-section="form"]')
                      formSection?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}