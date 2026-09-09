"use client"

import { toast } from "sonner"

import { useRealtimeRefresh, type RealtimeEventPayload } from "@/hooks/use-realtime-refresh"

/** Mount once per authenticated layout (judge or participant). Judge/admin
 * gets the generic submission toast; the projector board uses its own
 * listener since it also needs the token query param. */
export function RealtimeListener({ showSubmissionToast = false }: { showSubmissionToast?: boolean }) {
  function handleEvent(event: RealtimeEventPayload) {
    if (showSubmissionToast && event.type === "submission_received") {
      toast("Submission baru diterima.")
    }
  }

  useRealtimeRefresh({ onEvent: handleEvent })
  return null
}
