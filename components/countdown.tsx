"use client"

import { useEffect, useState } from "react"

function format(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hh = Math.floor(totalSeconds / 3600)
  const mm = Math.floor((totalSeconds % 3600) / 60)
  const ss = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, "0")
  return hh > 0 ? `${pad(hh)}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`
}

/** Purely presentational local ticker — resyncs to `remainingMs` whenever
 * the server sends a fresh value (on mount and after every realtime
 * refresh), and only ticks on its own while the competition is running. */
export function Countdown({
  remainingMs,
  state,
  className,
}: {
  remainingMs: number
  state: "not_started" | "running" | "paused" | "closed"
  className?: string
}) {
  const [syncedRemainingMs, setSyncedRemainingMs] = useState(remainingMs)
  const [displayMs, setDisplayMs] = useState(remainingMs)

  // Resync during render when the server sends a fresh value, per React's
  // "adjusting state when a prop changes" pattern — avoids an extra effect
  // render pass.
  if (remainingMs !== syncedRemainingMs) {
    setSyncedRemainingMs(remainingMs)
    setDisplayMs(remainingMs)
  }

  useEffect(() => {
    if (state !== "running") return
    const interval = setInterval(() => {
      setDisplayMs((prev) => Math.max(0, prev - 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [state])

  return <span className={className}>{format(displayMs)}</span>
}
