"use client"

import TerminalMeetingPoints from "@/components/admin/TerminalMeetingPoints"
import { 
  createTerminalMeetingPoint, 
  updateTerminalMeetingPoint, 
  deleteTerminalMeetingPoint, 
  toggleTerminalMeetingPointActive 
} from "@/app/admin/actions"

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
}

export default function TerminalMeetingPointsClient({ initialMeetingPoints }: Props) {
  const handleCreateMeetingPoint = async (data: any) => {
    return await createTerminalMeetingPoint(data)
  }

  const handleUpdateMeetingPoint = async (id: string, data: any) => {
    return await updateTerminalMeetingPoint(id, data)
  }

  const handleDeleteMeetingPoint = async (id: string) => {
    return await deleteTerminalMeetingPoint(id)
  }

  const handleToggleMeetingPoint = async (id: string, isActive: boolean) => {
    return await toggleTerminalMeetingPointActive(id, isActive)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Terminal Meeting Points</h1>
        <p className="text-gray-600 mt-1">
          Manage airport terminal pickup locations and timing information
        </p>
      </div>

      <TerminalMeetingPoints
        initialMeetingPoints={initialMeetingPoints}
        onCreateMeetingPoint={handleCreateMeetingPoint}
        onUpdateMeetingPoint={handleUpdateMeetingPoint}
        onDeleteMeetingPoint={handleDeleteMeetingPoint}
        onToggleMeetingPoint={handleToggleMeetingPoint}
      />
    </div>
  )
}