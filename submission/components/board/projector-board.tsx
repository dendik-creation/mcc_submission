"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh"
import { COMPETITION_STATE_LABEL } from "@/lib/labels"

function format(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hh = Math.floor(totalSeconds / 3600)
  const mm = Math.floor((totalSeconds % 3600) / 60)
  const ss = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, "0")
  return hh > 0 ? `${pad(hh)}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`
}

type CompetitionState = "not_started" | "running" | "paused" | "closed"

const STATE_STYLE: Record<CompetitionState, { pill: string; dot: string }> = {
  not_started: { pill: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  running: { pill: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  paused: { pill: "bg-amber-500/15 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  closed: { pill: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
}

export function ProjectorBoard({
  token,
  name,
  state,
  remainingMs,
  thresholdSeconds,
  registeredCount,
  submittedCount,
}: {
  token: string
  name: string
  state: CompetitionState
  remainingMs: number
  thresholdSeconds: number[]
  registeredCount: number
  submittedCount: number
}) {
  const [syncedRemainingMs, setSyncedRemainingMs] = useState(remainingMs)
  const [displayMs, setDisplayMs] = useState(remainingMs)
  const [bigMessage, setBigMessage] = useState<string | null>(null)
  const firedThresholds = useRef(new Set<number>())

  // Resync during render when the server sends a fresh value (React's
  // "adjusting state when a prop changes" pattern).
  if (remainingMs !== syncedRemainingMs) {
    setSyncedRemainingMs(remainingMs)
    setDisplayMs(remainingMs)
  }

  // Reset which thresholds have fired whenever the competition (re)starts.
  useEffect(() => {
    if (state === "not_started") firedThresholds.current.clear()
  }, [state])

  useEffect(() => {
    if (state !== "running") return
    const interval = setInterval(() => {
      setDisplayMs((prev) => {
        const next = Math.max(0, prev - 1000)
        const secondsLeft = Math.floor(next / 1000)
        for (const threshold of thresholdSeconds) {
          if (secondsLeft === threshold && !firedThresholds.current.has(threshold)) {
            firedThresholds.current.add(threshold)
            setBigMessage(`${Math.round(threshold / 60)} menit tersisa`)
          }
        }
        if (next === 0) setBigMessage("Waktu pengerjaan selesai")
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [state, thresholdSeconds])

  useEffect(() => {
    if (!bigMessage) return
    const timeout = setTimeout(() => setBigMessage(null), 6000)
    return () => clearTimeout(timeout)
  }, [bigMessage])

  useRealtimeRefresh({
    token,
    onEvent: (event) => {
      // Generic only — never identity, link, or score data (docs/03).
      if (event.type === "submission_received") toast("Submission baru diterima.")
    },
  })

  const stateStyle = STATE_STYLE[state]
  const progressPct = registeredCount > 0 ? Math.min(100, (submittedCount / registeredCount) * 100) : 0

  return (
    <div className="bg-background relative flex min-h-svh flex-col items-center justify-between overflow-hidden p-8 text-center sm:p-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in oklch, var(--primary) 12%, transparent), transparent)",
        }}
      />

      <div className="relative flex flex-col items-center gap-3">
        <h1 className="font-heading text-2xl font-medium sm:text-3xl">{name}</h1>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium sm:text-base ${stateStyle.pill}`}
        >
          <span className={`size-2 rounded-full ${stateStyle.dot} ${state === "running" ? "animate-pulse" : ""}`} />
          {COMPETITION_STATE_LABEL[state]}
        </span>
      </div>

      <div className="relative font-heading leading-none font-bold tabular-nums text-[clamp(4.5rem,20vw,15rem)]">
        {format(displayMs)}
      </div>

      <div className="relative flex w-full max-w-xl flex-col items-center gap-3">
        <div className="flex w-full items-baseline justify-between text-lg sm:text-2xl">
          <span className="font-heading font-semibold">
            {submittedCount} <span className="text-muted-foreground font-sans text-base sm:text-lg">submission</span>
          </span>
          <span className="text-muted-foreground text-base sm:text-lg">
            dari {registeredCount} terdaftar
          </span>
        </div>
        <div className="bg-muted h-3 w-full overflow-hidden rounded-full sm:h-4">
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {bigMessage && (
        <div className="animate-in fade-in zoom-in-95 fixed inset-0 z-50 flex items-center justify-center bg-black/90 duration-300">
          <p className="px-8 text-center text-5xl font-bold text-white sm:text-7xl">{bigMessage}</p>
        </div>
      )}
    </div>
  )
}
