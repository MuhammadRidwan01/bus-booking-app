import SendQueueClient from "./SendQueueClient"
import { getSendQueue } from "../data"

export const dynamic = "force-dynamic"

export default async function SendQueuePage() {
  const queue = await getSendQueue()
  return <SendQueueClient initialQueue={queue} />
}
