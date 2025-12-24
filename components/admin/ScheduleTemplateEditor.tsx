"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus, Clock } from "lucide-react"
import { toast } from "sonner"

interface ScheduleTime {
  id?: string
  departure_time: string
  capacity: number
  is_active: boolean
}

interface ScheduleTemplate {
  id?: string
  name: string
  service_type: 'drop_off' | 'pick_up'
  hotel: 'ibis_style' | 'ibis_budget'
  is_active: boolean
  schedule_times: ScheduleTime[]
}

interface Props {
  template?: ScheduleTemplate
  hotels: Array<{ id: string; name: string; slug: string }>
  onSave: (template: ScheduleTemplate) => Promise<{ ok: boolean; error?: string }>
  onCancel: () => void
}

const DEFAULT_DROP_OFF_TIMES = [
  '03:00', '04:30', '06:00', '07:30', '09:00', '10:30', 
  '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '00:00'
]

const DEFAULT_PICK_UP_TIMES = [
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'
]

export default function ScheduleTemplateEditor({ template, hotels, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState<ScheduleTemplate>(() => ({
    id: template?.id,
    name: template?.name || '',
    service_type: template?.service_type || 'drop_off',
    hotel: template?.hotel || 'ibis_style',
    is_active: template?.is_active ?? true,
    schedule_times: template?.schedule_times || []
  }))
  
  const [loading, startTransition] = useTransition()

  const handleServiceTypeChange = (serviceType: 'drop_off' | 'pick_up') => {
    const defaultTimes = serviceType === 'drop_off' ? DEFAULT_DROP_OFF_TIMES : DEFAULT_PICK_UP_TIMES
    
    setFormData(prev => ({
      ...prev,
      service_type: serviceType,
      schedule_times: defaultTimes.map(time => ({
        departure_time: time,
        capacity: 15,
        is_active: true
      }))
    }))
  }

  const addScheduleTime = () => {
    setFormData(prev => ({
      ...prev,
      schedule_times: [...prev.schedule_times, {
        departure_time: '06:00',
        capacity: 15,
        is_active: true
      }]
    }))
  }

  const updateScheduleTime = (index: number, field: keyof ScheduleTime, value: any) => {
    setFormData(prev => ({
      ...prev,
      schedule_times: prev.schedule_times.map((time, i) => 
        i === index ? { ...time, [field]: value } : time
      )
    }))
  }

  const removeScheduleTime = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedule_times: prev.schedule_times.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Template name is required")
      return
    }

    if (formData.schedule_times.length === 0) {
      toast.error("At least one departure time is required")
      return
    }

    startTransition(async () => {
      const result = await onSave(formData)
      if (result.ok) {
        toast.success(template ? "Template updated successfully" : "Template created successfully")
      } else {
        toast.error(result.error || "Failed to save template")
      }
    })
  }

  const loadDefaultTimes = () => {
    const defaultTimes = formData.service_type === 'drop_off' ? DEFAULT_DROP_OFF_TIMES : DEFAULT_PICK_UP_TIMES
    setFormData(prev => ({
      ...prev,
      schedule_times: defaultTimes.map(time => ({
        departure_time: time,
        capacity: 15,
        is_active: true
      }))
    }))
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>
          {template ? 'Edit Schedule Template' : 'Create Schedule Template'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Ibis Styles Drop-off Schedule"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hotel">Hotel</Label>
              <Select 
                value={formData.hotel} 
                onValueChange={(value: 'ibis_style' | 'ibis_budget') => 
                  setFormData(prev => ({ ...prev, hotel: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ibis_style">Ibis Styles</SelectItem>
                  <SelectItem value="ibis_budget">Ibis Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service_type">Service Type</Label>
              <Select 
                value={formData.service_type} 
                onValueChange={handleServiceTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drop_off">Drop-off (Hotel → Airport)</SelectItem>
                  <SelectItem value="pick_up">Pick-up (Airport → Hotel)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Template Active</Label>
            </div>
          </div>

          {/* Schedule Times */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Departure Times</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadDefaultTimes}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Load Default Times
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addScheduleTime}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time
                </Button>
              </div>
            </div>

            {formData.schedule_times.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No departure times configured</p>
                <p className="text-sm">Click &quot;Load Default Times&quot; to start with official schedule</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {formData.schedule_times
                  .sort((a, b) => a.departure_time.localeCompare(b.departure_time))
                  .map((time, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1 grid gap-4 md:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Departure Time</Label>
                        <Input
                          type="time"
                          value={time.departure_time}
                          onChange={(e) => updateScheduleTime(index, 'departure_time', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">Capacity</Label>
                        <Input
                          type="number"
                          min="1"
                          max="50"
                          value={time.capacity}
                          onChange={(e) => updateScheduleTime(index, 'capacity', parseInt(e.target.value) || 15)}
                          className="text-sm"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={time.is_active}
                          onCheckedChange={(checked) => updateScheduleTime(index, 'is_active', checked)}
                        />
                        <Label className="text-xs">Active</Label>
                        {!time.is_active && (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeScheduleTime(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (template ? 'Update Template' : 'Create Template')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}