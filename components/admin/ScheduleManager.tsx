"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Clock, Users, Settings } from "lucide-react"
import { toast } from "sonner"
import ScheduleTemplateEditor from "./ScheduleTemplateEditor"

interface ScheduleTime {
  id: string
  departure_time: string
  capacity: number
  is_active: boolean
}

interface ScheduleTemplate {
  id: string
  name: string
  service_type: 'drop_off' | 'pick_up'
  hotel: 'ibis_style' | 'ibis_budget'
  is_active: boolean
  created_at: string
  updated_at: string
  schedule_times: ScheduleTime[]
}

interface Props {
  initialTemplates: ScheduleTemplate[]
  hotels: Array<{ id: string; name: string; slug: string }>
  onCreateTemplate: (template: any) => Promise<{ ok: boolean; error?: string }>
  onUpdateTemplate: (id: string, template: any) => Promise<{ ok: boolean; error?: string }>
  onDeleteTemplate: (id: string) => Promise<{ ok: boolean; error?: string }>
  onToggleTemplate: (id: string, isActive: boolean) => Promise<{ ok: boolean; error?: string }>
}

export default function ScheduleManager({ 
  initialTemplates, 
  hotels, 
  onCreateTemplate, 
  onUpdateTemplate, 
  onDeleteTemplate,
  onToggleTemplate 
}: Props) {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>(initialTemplates)
  const [showEditor, setShowEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | undefined>()

  useEffect(() => {
    setTemplates(initialTemplates)
  }, [initialTemplates])

  const handleCreateTemplate = async (templateData: any) => {
    const result = await onCreateTemplate(templateData)
    if (result.ok) {
      setShowEditor(false)
      // Refresh templates list - in a real app you'd refetch from server
      window.location.reload()
    }
    return result
  }

  const handleUpdateTemplate = async (templateData: any) => {
    if (!editingTemplate?.id) return { ok: false, error: "No template selected" }
    
    const result = await onUpdateTemplate(editingTemplate.id, templateData)
    if (result.ok) {
      setShowEditor(false)
      setEditingTemplate(undefined)
      // Refresh templates list - in a real app you'd refetch from server
      window.location.reload()
    }
    return result
  }

  const handleDeleteTemplate = async (template: ScheduleTemplate) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${template.name}"?\n\nThis will remove the template and may affect future schedule generation.`
    )
    
    if (!confirmed) return

    const result = await onDeleteTemplate(template.id)
    if (result.ok) {
      toast.success("Template deleted successfully")
      setTemplates(prev => prev.filter(t => t.id !== template.id))
    } else {
      toast.error(result.error || "Failed to delete template")
    }
  }

  const handleToggleActive = async (template: ScheduleTemplate) => {
    const result = await onToggleTemplate(template.id, !template.is_active)
    if (result.ok) {
      toast.success(`Template ${!template.is_active ? 'activated' : 'deactivated'}`)
      setTemplates(prev => prev.map(t => 
        t.id === template.id ? { ...t, is_active: !t.is_active } : t
      ))
    } else {
      toast.error(result.error || "Failed to update template")
    }
  }

  const openEditor = (template?: ScheduleTemplate) => {
    setEditingTemplate(template)
    setShowEditor(true)
  }

  const closeEditor = () => {
    setShowEditor(false)
    setEditingTemplate(undefined)
  }

  const getServiceTypeLabel = (serviceType: string) => {
    return serviceType === 'drop_off' ? 'Drop-off (Hotel → Airport)' : 'Pick-up (Airport → Hotel)'
  }

  const getHotelLabel = (hotel: string) => {
    return hotel === 'ibis_style' ? 'Ibis Styles' : 'Ibis Budget'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Schedule Templates</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Manage schedule templates for different service types and hotels
            </p>
          </div>
          <Button onClick={() => openEditor()}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
              <p className="text-gray-500 mb-4">
                Create your first schedule template to start managing departure times
              </p>
              <Button onClick={() => openEditor()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => {
                const activeTimes = template.schedule_times.filter(t => t.is_active).length
                const totalCapacity = template.schedule_times
                  .filter(t => t.is_active)
                  .reduce((sum, t) => sum + t.capacity, 0)

                return (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge variant={template.is_active ? "default" : "secondary"}>
                            {template.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {getServiceTypeLabel(template.service_type)}
                          </Badge>
                        </div>
                        
                        <div className="grid gap-2 text-sm text-gray-600 md:grid-cols-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{getHotelLabel(template.hotel)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{activeTimes} active times</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{totalCapacity} total capacity</span>
                          </div>
                        </div>

                        {template.schedule_times.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-2">Departure Times:</p>
                            <div className="flex flex-wrap gap-1">
                              {template.schedule_times
                                .sort((a, b) => a.departure_time.localeCompare(b.departure_time))
                                .map((time, index) => (
                                <Badge 
                                  key={index} 
                                  variant={time.is_active ? "secondary" : "outline"}
                                  className="text-xs"
                                >
                                  {time.departure_time} ({time.capacity})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(template)}
                        >
                          {template.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditor(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Schedule Template' : 'Create Schedule Template'}
            </DialogTitle>
          </DialogHeader>
          <ScheduleTemplateEditor
            template={editingTemplate}
            hotels={hotels}
            onSave={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
            onCancel={closeEditor}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}