"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/pricing"
import { format } from "date-fns"
import { AlertCircle, CheckCircle, DollarSign, History, Save, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { 
  fetchPricingConfig, 
  fetchPricingHistory, 
  updatePricingConfig 
} from "./actions"

interface PricingConfig {
  id: string
  surfboard_cost_per_board: number
  baggage_free_items_per_passenger: number
  baggage_terminal3_curbside_cost: number
  baggage_other_terminals_cost: number
  currency: string
  effective_date: string
  created_by: string
  created_at: string
  is_active: boolean
}

interface PricingHistoryItem {
  id: string
  surfboard_cost_per_board: number
  baggage_terminal3_curbside_cost: number
  baggage_other_terminals_cost: number
  effective_date: string
  created_by: string
  created_at: string
  is_active: boolean
}

export default function PricingConfigClient() {
  const [currentConfig, setCurrentConfig] = useState<PricingConfig | null>(null)
  const [history, setHistory] = useState<PricingHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    surfboard_cost_per_board: 75000,
    baggage_terminal3_curbside_cost: 150000,
    baggage_other_terminals_cost: 75000,
  })

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [configResult, historyResult] = await Promise.all([
        fetchPricingConfig(),
        fetchPricingHistory()
      ])
      
      if (!configResult.ok) {
        throw new Error(configResult.error || 'Failed to fetch pricing configuration')
      }
      
      if (!historyResult.ok) {
        throw new Error(historyResult.error || 'Failed to fetch pricing history')
      }
      
      setCurrentConfig(configResult.data)
      setHistory(historyResult.data || [])
      
      // Update form with current values
      if (configResult.data) {
        setFormData({
          surfboard_cost_per_board: configResult.data.surfboard_cost_per_board,
          baggage_terminal3_curbside_cost: configResult.data.baggage_terminal3_curbside_cost,
          baggage_other_terminals_cost: configResult.data.baggage_other_terminals_cost,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      toast.error('Failed to load pricing configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentConfig) return
    
    try {
      setUpdating(true)
      setError(null)
      
      const result = await updatePricingConfig({
        surfboard_cost_per_board: formData.surfboard_cost_per_board,
        baggage_terminal3_curbside_cost: formData.baggage_terminal3_curbside_cost,
        baggage_other_terminals_cost: formData.baggage_other_terminals_cost,
      })
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to update pricing configuration')
      }
      
      toast.success('Pricing configuration updated successfully')
      await loadData() // Reload to get updated data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setUpdating(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    const numValue = parseInt(value) || 0
    setFormData(prev => ({
      ...prev,
      [field]: numValue
    }))
  }

  const hasChanges = currentConfig && (
    formData.surfboard_cost_per_board !== currentConfig.surfboard_cost_per_board ||
    formData.baggage_terminal3_curbside_cost !== currentConfig.baggage_terminal3_curbside_cost ||
    formData.baggage_other_terminals_cost !== currentConfig.baggage_other_terminals_cost
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading pricing configuration...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error && !currentConfig) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2" 
            onClick={loadData}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Configuration Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Current Pricing Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentConfig ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Surfboard Handling</Label>
                <div className="text-2xl font-semibold">
                  {formatCurrency(currentConfig.surfboard_cost_per_board)}
                </div>
                <p className="text-xs text-gray-500">per surfboard, per trip</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Free Baggage Allowance</Label>
                <div className="text-2xl font-semibold">
                  {currentConfig.baggage_free_items_per_passenger} items
                </div>
                <p className="text-xs text-gray-500">per passenger</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Excess Baggage (Terminal 3)</Label>
                <div className="text-2xl font-semibold">
                  {formatCurrency(currentConfig.baggage_terminal3_curbside_cost)}
                </div>
                <p className="text-xs text-gray-500">per trip (curbside pickup)</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Excess Baggage (Other Terminals)</Label>
                <div className="text-2xl font-semibold">
                  {formatCurrency(currentConfig.baggage_other_terminals_cost)}
                </div>
                <p className="text-xs text-gray-500">per trip</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No pricing configuration found</p>
          )}
          
          {currentConfig && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Last updated: {format(new Date(currentConfig.created_at), 'PPp')}</span>
                <Badge variant={currentConfig.is_active ? "default" : "secondary"}>
                  {currentConfig.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Updated by: {currentConfig.created_by}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Form */}
      <Card>
        <CardHeader>
          <CardTitle>Update Pricing Configuration</CardTitle>
          <p className="text-sm text-gray-600">
            Changes will apply immediately to new bookings. Existing bookings retain their original pricing.
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="surfboard_cost">Surfboard Handling Cost (IDR)</Label>
                <Input
                  id="surfboard_cost"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.surfboard_cost_per_board}
                  onChange={(e) => handleInputChange('surfboard_cost_per_board', e.target.value)}
                  placeholder="75000"
                />
                <p className="text-xs text-gray-500">Cost per surfboard, per trip</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="baggage_terminal3">Terminal 3 Excess Baggage (IDR)</Label>
                <Input
                  id="baggage_terminal3"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.baggage_terminal3_curbside_cost}
                  onChange={(e) => handleInputChange('baggage_terminal3_curbside_cost', e.target.value)}
                  placeholder="150000"
                />
                <p className="text-xs text-gray-500">Cost for Terminal 3 curbside pickup</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="baggage_other">Other Terminals Excess Baggage (IDR)</Label>
                <Input
                  id="baggage_other"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.baggage_other_terminals_cost}
                  onChange={(e) => handleInputChange('baggage_other_terminals_cost', e.target.value)}
                  placeholder="75000"
                />
                <p className="text-xs text-gray-500">Cost for other terminals</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {hasChanges ? (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    You have unsaved changes
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Configuration is up to date
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadData}
                  disabled={updating}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <Button
                  type="submit"
                  disabled={!hasChanges || updating}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updating ? 'Updating...' : 'Update Pricing'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Pricing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Pricing History
          </CardTitle>
          <p className="text-sm text-gray-600">
            Recent changes to pricing configuration
          </p>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Active" : "Historical"}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {format(new Date(item.created_at), 'PPp')}
                    </span>
                  </div>
                  
                  <div className="grid gap-2 text-sm md:grid-cols-3">
                    <div>
                      <span className="font-medium">Surfboard:</span>{' '}
                      {formatCurrency(item.surfboard_cost_per_board)}
                    </div>
                    <div>
                      <span className="font-medium">Terminal 3:</span>{' '}
                      {formatCurrency(item.baggage_terminal3_curbside_cost)}
                    </div>
                    <div>
                      <span className="font-medium">Other Terminals:</span>{' '}
                      {formatCurrency(item.baggage_other_terminals_cost)}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Updated by: {item.created_by}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No pricing history available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}