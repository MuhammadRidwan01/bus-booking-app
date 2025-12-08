"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function ConfirmationTimeout() {
  const router = useRouter()

  useEffect(() => {
    // If still on loading state after 35 seconds, redirect to home with error
    const timeout = setTimeout(() => {
      router.replace("/?error=timeout")
    }, 35000)

    return () => clearTimeout(timeout)
  }, [router])

  return null
}
