"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { setParticipantStatusAction } from "@/lib/actions/participants"
import { Button } from "@/components/ui/button"

export function ParticipantStatusButton({
  participantId,
  status,
}: {
  participantId: string
  status: "registered" | "disabled"
}) {
  const [pending, startTransition] = useTransition()
  const nextStatus = status === "registered" ? "disabled" : "registered"

  function toggle() {
    startTransition(async () => {
      try {
        await setParticipantStatusAction(participantId, nextStatus)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal")
      }
    })
  }

  return (
    <Button size="sm" variant="outline" onClick={toggle} disabled={pending}>
      {status === "registered" ? "Nonaktifkan" : "Aktifkan"}
    </Button>
  )
}
