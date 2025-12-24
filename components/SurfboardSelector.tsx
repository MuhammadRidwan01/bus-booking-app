"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Waves } from "lucide-react"

interface SurfboardPricing {
  costPerBoard: number
  currency: string
}

interface SurfboardSelectorProps {
  hasSurfboard: boolean
  surfboardCount: number
  onSurfboardChange: (has: boolean, count: number) => void
  pricing: SurfboardPricing
  errors?: Record<string, string>
}

export function SurfboardSelector({
  hasSurfboard,
  surfboardCount,
  onSurfboardChange,
  pricing,
  errors = {}
}: SurfboardSelectorProps) {
  const handleHasSurfboardChange = (value: string) => {
    const has = value === "yes"
    onSurfboardChange(has, has ? 1 : 0)
  }

  const handleCountChange = (value: string) => {
    const count = parseInt(value, 10)
    onSurfboardChange(true, count)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: pricing.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const totalCost = hasSurfboard ? surfboardCount * pricing.costPerBoard : 0

  return (
    <div className="space-y-4">
      {/* Has Surfboard Selection */}
      <div className="space-y-2">
        <Label htmlFor="hasSurfboard" className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Waves className="h-4 w-4 text-primary" />
          Surfboard Equipment
        </Label>
        <Select 
          value={hasSurfboard ? "yes" : "no"} 
          onValueChange={handleHasSurfboardChange}
        >
          <SelectTrigger 
            id="hasSurfboard"
            className={`h-10 rounded-xl ${errors.hasSurfboard ? 'border-red-500' : ''}`}
          >
            <SelectValue placeholder="Do you have surfboards?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no">No surfboard</SelectItem>
            <SelectItem value="yes">Yes, I have surfboard(s)</SelectItem>
          </SelectContent>
        </Select>
        {errors.hasSurfboard && (
          <p className="text-sm text-red-600">{errors.hasSurfboard}</p>
        )}
        <p className="text-xs text-slate-600">
          Special handling required for surfboards ({formatCurrency(pricing.costPerBoard)} per board)
        </p>
      </div>

      {/* Surfboard Count - Only show if has surfboard */}
      {hasSurfboard && (
        <div className="space-y-2">
          <Label htmlFor="surfboardCount" className="text-sm font-semibold text-slate-800">
            Number of surfboards
          </Label>
          <Select 
            value={surfboardCount.toString()} 
            onValueChange={handleCountChange}
          >
            <SelectTrigger 
              id="surfboardCount"
              className={`h-10 rounded-xl ${errors.surfboardCount ? 'border-red-500' : ''}`}
            >
              <SelectValue placeholder="Select count" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n} surfboard{n > 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.surfboardCount && (
            <p className="text-sm text-red-600">{errors.surfboardCount}</p>
          )}
          {totalCost > 0 && (
            <p className="text-sm font-medium text-blue-600">
              Total: {formatCurrency(totalCost)}
            </p>
          )}
        </div>
      )}

      {/* Hidden inputs for form submission */}
      <input type="hidden" name="hasSurfboard" value={hasSurfboard ? "true" : "false"} />
      <input type="hidden" name="surfboardCount" value={surfboardCount} />
    </div>
  )
}
