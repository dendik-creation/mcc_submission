"use client"

import { useCallback } from "react"
import { toast } from "sonner"

import { useRealtimeRefresh, type RealtimeEventPayload } from "@/hooks/use-realtime-refresh"

export function RealtimeListener({ showSubmissionToast = false }: { showSubmissionToast?: boolean }) {
  // useCallback so the reference is stable — an inline function here
  // changes every render, causing useRealtimeRefresh's effect to re-run
  // and close/reopen the WS in a tight loop, flooding router.refresh()
  // and triggering spurious auth redirects.
  const handleEvent = useCallback(
    (event: RealtimeEventPayload) => {
      if (showSubmissionToast && event.type === "submission_received") {
        toast("Submission baru diterima.")
      }
    },
    [showSubmissionToast],
  )

  useRealtimeRefresh({ onEvent: handleEvent })
  return null
}
