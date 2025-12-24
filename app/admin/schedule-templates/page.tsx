import { getScheduleTemplates, getHotels } from "../data"
import ScheduleTemplatesClient from "./ScheduleTemplatesClient"

export const dynamic = "force-dynamic"

export default async function AdminScheduleTemplatesPage() {
  const [templates, hotels] = await Promise.all([
    getScheduleTemplates(),
    getHotels(),
  ])

  return <ScheduleTemplatesClient initialTemplates={templates as any} hotels={hotels} />
}