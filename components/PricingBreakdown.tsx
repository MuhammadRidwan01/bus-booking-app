"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Receipt, Gift, Waves, Luggage } from "lucide-react"

interface PricingItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface PricingBreakdownProps {
  basePrice: number // 0 for free service
  surfboardCost: number
  baggageCost: number
  totalCost: number
  currency: string
  breakdown: PricingItem[]
  className?: string
}

export function PricingBreakdown({
  basePrice,
  surfboardCost,
  baggageCost,
  totalCost,
  currency,
  breakdown,
  className = ""
}: PricingBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Don't show the component if there are no additional costs
  const hasAdditionalCosts = surfboardCost > 0 || baggageCost > 0 || totalCost > 0

  if (!hasAdditionalCosts) {
    return (
      <Card className={`border border-green-100 bg-green-50/30 rounded-2xl ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Gift className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                Free Service
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Your shuttle booking is complimentary for hotel guests
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border border-slate-200 bg-white rounded-2xl shadow-sm ${className}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Receipt className="h-5 w-5 text-slate-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">
              Cost Breakdown
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Additional services and fees
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Base Service */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-green-600" />
              <span className="text-sm text-slate-700">Shuttle Service</span>
            </div>
            <span className="text-sm font-medium text-green-600">
              {formatCurrency(basePrice)}
            </span>
          </div>

          {/* Surfboard Cost */}
          {surfboardCost > 0 && (
            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-slate-700">Surfboard Handling</span>
              </div>
              <span className="text-sm font-medium text-slate-900">
                {formatCurrency(surfboardCost)}
              </span>
            </div>
          )}

          {/* Baggage Cost */}
          {baggageCost > 0 && (
            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Luggage className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-slate-700">Excess Baggage</span>
              </div>
              <span className="text-sm font-medium text-slate-900">
                {formatCurrency(baggageCost)}
              </span>
            </div>
          )}

          {/* Detailed Breakdown */}
          {breakdown.length > 0 && (
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Item Details
              </h4>
              {breakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex-1">
                    <span className="text-slate-600">
                      {item.description}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-slate-500 ml-1">
                        × {item.quantity}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-700 font-medium">
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          <div className="border-t-2 border-slate-300 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-slate-900">
                Total Amount
              </span>
              <span className="text-lg font-bold text-slate-900">
                {formatCurrency(totalCost)}
              </span>
            </div>
            {totalCost === 0 && (
              <p className="text-xs text-green-600 mt-1">
                No additional charges - service remains free!
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}