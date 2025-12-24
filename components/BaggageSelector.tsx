"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Luggage } from "lucide-react"

interface BaggagePricing {
  freeItemsPerPassenger: number
  terminal3CurbsideCost: number
  otherTerminalsCost: number
  currency: string
}

interface BaggageSelectorProps {
  passengerCount: number
  excessBaggageCount: number
  terminalCode?: string
  onExcessBaggageChange: (count: number) => void
  pricing: BaggagePricing
  errors?: Record<string, string>
}

export function BaggageSelector({
  passengerCount,
  excessBaggageCount,
  terminalCode,
  onExcessBaggageChange,
  pricing,
  errors = {}
}: BaggageSelectorProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: pricing.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const hasExcessBaggage = excessBaggageCount > 0

  const handleExcessBaggageToggle = (checked: boolean) => {
    onExcessBaggageChange(checked ? 1 : 0)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Luggage className="h-4 w-4 text-primary" />
          Baggage Allowance
        </Label>
        
        {/* Excess Baggage Checkbox */}
        <div className="flex items-start space-x-3 p-3 border border-amber-200 rounded-xl bg-amber-50">
          <Checkbox
            id="hasExcessBaggage"
            checked={hasExcessBaggage}
            onCheckedChange={handleExcessBaggageToggle}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label 
              htmlFor="hasExcessBaggage" 
              className="text-sm font-medium text-slate-900 cursor-pointer"
            >
              I have excess baggage beyond the free allowance
            </Label>
            <div className="text-xs text-slate-600 mt-1 space-y-1">
              <p>Additional charges apply:</p>
              <p>• Terminal 3 Curbside: {formatCurrency(pricing.terminal3CurbsideCost)} per trip</p>
              <p>• Other Terminals: {formatCurrency(pricing.otherTerminalsCost)} per trip</p>
            </div>
          </div>
        </div>

        {errors.excessBaggageCount && (
          <p className="text-sm text-red-600">{errors.excessBaggageCount}</p>
        )}
      </div>

      {/* Hidden input for form submission */}
      <input type="hidden" name="hasExcessBaggage" value={hasExcessBaggage ? "true" : "false"} />
      <input type="hidden" name="excessBaggageCount" value={excessBaggageCount} />
    </div>
  )
}