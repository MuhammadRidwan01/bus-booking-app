"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Home, Plane } from "lucide-react"

interface ServiceSpecificFieldsProps {
  serviceType: 'drop_off' | 'pick_up' | null
  roomNumber?: string
  flightNumber?: string
  onRoomNumberChange: (value: string) => void
  onFlightNumberChange: (value: string) => void
  errors?: Record<string, string>
}

export function ServiceSpecificFields({
  serviceType,
  roomNumber = "",
  flightNumber = "",
  onRoomNumberChange,
  onFlightNumberChange,
  errors = {}
}: ServiceSpecificFieldsProps) {
  // Don't render anything if no service type is selected
  if (!serviceType) {
    return null
  }

  return (
    <div className="space-y-4">
      {serviceType === "drop_off" && (
        <div className="space-y-2">
          <Label htmlFor="roomNumber" className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            Room Number
          </Label>
          <Input
            id="roomNumber"
            name="roomNumber"
            value={roomNumber}
            onChange={(e) => onRoomNumberChange(e.target.value)}
            placeholder="e.g., 1205, A-301"
            className={`h-10 rounded-xl ${errors.roomNumber ? 'border-red-500 focus:border-red-500' : ''}`}
            required
          />
          {errors.roomNumber && (
            <p className="text-sm text-red-600 mt-1">{errors.roomNumber}</p>
          )}
          <p className="text-xs text-slate-600">
            Enter your hotel room number for pickup coordination
          </p>
        </div>
      )}

      {serviceType === "pick_up" && (
        <div className="space-y-2">
          <Label htmlFor="flightNumber" className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" />
            Flight Number
          </Label>
          <Input
            id="flightNumber"
            name="flightNumber"
            value={flightNumber}
            onChange={(e) => onFlightNumberChange(e.target.value)}
            placeholder="e.g., GA123, QZ8501"
            className={`h-10 rounded-xl ${errors.flightNumber ? 'border-red-500 focus:border-red-500' : ''}`}
            required
          />
          {errors.flightNumber && (
            <p className="text-sm text-red-600 mt-1">{errors.flightNumber}</p>
          )}
          <p className="text-xs text-slate-600">
            Enter your flight number for arrival tracking
          </p>
        </div>
      )}
    </div>
  )
}