"use client"

import { useState } from "react"
import ScheduleManager from "@/components/admin/ScheduleManager"
import { 
  createScheduleTemplate, 
  updateScheduleTemplate, 
  deleteScheduleTemplate, 
  toggleScheduleTemplateActive 
} from "@/app/admin/actions"

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
}

export default function ScheduleTemplatesClient({ initialTemplates, hotels }: Props) {
  const handleCreateTemplate = async (templateData: any) => {
    return await createScheduleTemplate(templateData)
  }

  const handleUpdateTemplate = async (id: string, templateData: any) => {
    return await updateScheduleTemplate(id, templateData)
  }

  const handleDeleteTemplate = async (id: string) => {
    return await deleteScheduleTemplate(id)
  }

  const handleToggleTemplate = async (id: string, isActive: boolean) => {
    return await toggleScheduleTemplateActive(id, isActive)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Schedule Templates</h1>
        <p className="text-gray-600 mt-1">
          Manage schedule templates for different service types and hotels
        </p>
      </div>

      <ScheduleManager
        initialTemplates={initialTemplates}
        hotels={hotels}
        onCreateTemplate={handleCreateTemplate}
        onUpdateTemplate={handleUpdateTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onToggleTemplate={handleToggleTemplate}
      />
    </div>
  )
}