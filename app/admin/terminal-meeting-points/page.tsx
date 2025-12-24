import { getTerminalMeetingPoints } from "../data"
import TerminalMeetingPointsClient from "./TerminalMeetingPointsClient"

export const dynamic = "force-dynamic"

export default async function AdminTerminalMeetingPointsPage() {
  const meetingPoints = await getTerminalMeetingPoints()

  return <TerminalMeetingPointsClient initialMeetingPoints={meetingPoints as any} />
}