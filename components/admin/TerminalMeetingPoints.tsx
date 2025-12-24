"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Plus, MapPin, Clock, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface TerminalMeetingPoint {
  id: string
  terminal_code: string
  location_description: string
  arrival_time_offset_min: number
  arrival_time_offset_max: number
  is_active?: boolean
  created_at: string
}

interface Props {
  initialMeetingPoints: TerminalMeetingPoint[]
  onCreateMeetingPoint: (data: any) => Promise<{ ok: boolean; error?: string }>
  onUpdateMeetingPoint: (id: string, data: any) => Promise<{ ok: boolean; error?: string }>
  onDeleteMeetingPoint: (id: string) => Promise<{ ok: boolean; error?: string }>
  onToggleMeetingPoint: (id: string, isActive: boolean) => Promise<{ ok: boolean; error?: string }>
}

export default function TerminalMeetingPoints({ 
  initialMeetingPoints, 
  onCreateMeetingPoint, 
  onUpdateMeetingPoint, 
  onDeleteMeetingPoint,
  onToggleMeetingPoint 
}: Props) {
  const [meetingPoints, setMeetingPoints] = useState<TerminalMeetingPoint[]>(initialMeetingPoints)
  const [showEditor, setShowEditor] = useState(false)
  const [editingPoint, setEditingPoint] = useState<TerminalMeetingPoint | undefined>()
  const [loading, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    terminal_code: '',
    location_description: '',
    arrival_time_offset_min: 15,
    arrival_time_offset_max: 20,
    is_active: true
  })

  const resetForm = () => {
    setFormData({
      terminal_code: '',
      location_description: '',
      arrival_time_offset_min: 15,
      arrival_time_offset_max: 20,
      is_active: true
    })
    setEditingPoint(undefined)
  }

  const openEditor = (point?: TerminalMeetingPoint) => {
    if (point) {
      setFormData({
        terminal_code: point.terminal_code,
        location_description: point.location_description,
        arrival_time_offset_min: point.arrival_time_offset_min,
        arrival_time_offset_max: point.arrival_time_offset_max,
        is_active: point.is_active ?? true
      })
      setEditingPoint(point)
    } else {
      resetForm()
    }
    setShowEditor(true)
  }

  const closeEditor = () => {
    setShowEditor(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.terminal_code.trim()) {
      toast.error("Terminal code is required")
      return
    }

    if (!formData.location_description.trim()) {
      toast.error("Location description is required")
      return
    }

    if (formData.arrival_time_offset_min >= formData.arrival_time_offset_max) {
      toast.error("Minimum arrival time must be less than maximum")
      return
    }

    startTransition(async () => {
      const result = editingPoint 
        ? await onUpdateMeetingPoint(editingPoint.id, formData)
        : await onCreateMeetingPoint(formData)
      
      if (result.ok) {
        toast.success(editingPoint ? "Meeting point updated successfully" : "Meeting point created successfully")
        closeEditor()
        // Refresh the list - in a real app you'd refetch from server
        window.location.reload()
      } else {
        toast.error(result.error || "Failed to save meeting point")
      }
    })
  }

  const handleDelete = async (point: TerminalMeetingPoint) => {
    const confirmed = confirm(
      `Are you sure you want to delete terminal ${point.terminal_code}?\n\nThis may affect existing bookings that reference this meeting point.`
    )
    
    if (!confirmed) return

    const result = await onDeleteMeetingPoint(point.id)
    if (result.ok) {
      toast.success("Meeting point deleted successfully")
      setMeetingPoints(prev => prev.filter(p => p.id !== point.id))
    } else {
      toast.error(result.error || "Failed to delete meeting point")
    }
  }

  const handleToggleActive = async (point: TerminalMeetingPoint) => {
    const result = await onToggleMeetingPoint(point.id, !(point.is_active ?? true))
    if (result.ok) {
      toast.success(`Meeting point ${!(point.is_active ?? true) ? 'activated' : 'deactivated'}`)
      setMeetingPoints(prev => prev.map(p => 
        p.id === point.id ? { ...p, is_active: !(point.is_active ?? true) } : p
      ))
    } else {
      toast.error(result.error || "Failed to update meeting point")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Terminal Meeting Points</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Manage airport terminal pickup locations and timing information
            </p>
          </div>
          <Button onClick={() => openEditor()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Meeting Point
          </Button>
        </CardHeader>
        <CardContent>
          {meetingPoints.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Meeting Points Found</h3>
              <p className="text-gray-500 mb-4">
                Add terminal meeting points to help guests find pickup locations
              </p>
              <Button onClick={() => openEditor()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Meeting Point
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Terminal</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Arrival Window</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetingPoints
                  .sort((a, b) => a.terminal_code.localeCompare(b.terminal_code))
                  .map((point) => (
                  <TableRow key={point.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {point.terminal_code}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm">{point.location_description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{point.arrival_time_offset_min}-{point.arrival_time_offset_max} min</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={point.is_active !== false ? "default" : "secondary"}>
                        {point.is_active !== false ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(point)}
                        >
                          {point.is_active !== false ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditor(point)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(point)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Meeting Point Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPoint ? 'Edit Meeting Point' : 'Add Meeting Point'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="terminal_code">Terminal Code</Label>
                <Input
                  id="terminal_code"
                  value={formData.terminal_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, terminal_code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., 1A, 2E, 3"
                  required
                />
                <p className="text-xs text-gray-500">
                  Use standard airport terminal codes (1A, 1B, 1C, 2E, 2F, 3)
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_description">Location Description</Label>
              <Textarea
                id="location_description"
                value={formData.location_description}
                onChange={(e) => setFormData(prev => ({ ...prev, location_description: e.target.value }))}
                placeholder="e.g., 2nd floor - arrival pick up point 1A"
                rows={3}
                required
              />
              <p className="text-xs text-gray-500">
                Provide clear directions for guests to find the pickup location
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="arrival_time_offset_min">Minimum Arrival Time (minutes)</Label>
                <Input
                  id="arrival_time_offset_min"
                  type="number"
                  min="5"
                  max="60"
                  value={formData.arrival_time_offset_min}
                  onChange={(e) => setFormData(prev => ({ ...prev, arrival_time_offset_min: parseInt(e.target.value) || 15 }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="arrival_time_offset_max">Maximum Arrival Time (minutes)</Label>
                <Input
                  id="arrival_time_offset_max"
                  type="number"
                  min="10"
                  max="90"
                  value={formData.arrival_time_offset_max}
                  onChange={(e) => setFormData(prev => ({ ...prev, arrival_time_offset_max: parseInt(e.target.value) || 20 }))}
                  required
                />
              </div>
            </div>
            
            <p className="text-xs text-gray-500">
              Arrival time window after shuttle departure from airport (e.g., 15-20 minutes for Terminal 1)
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={closeEditor}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (editingPoint ? 'Update Meeting Point' : 'Add Meeting Point')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}