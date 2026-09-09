"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export type RealtimeEventPayload = {
  type: "timer_changed" | "submission_received" | "submission_updated" | "status_changed"
  [key: string]: unknown
}

/** Subscribes to the /ws gateway and calls router.refresh() on every
 * relevant event so Server Components re-fetch authoritative state
 * (docs/03: browser state is only ever a view of the server's). Falls back
 * to polling refresh() every 5s while disconnected, and reconnects with
 * capped exponential backoff. */
export function useRealtimeRefresh(options?: {
  token?: string
  onEvent?: (event: RealtimeEventPayload) => void
}) {
  const router = useRouter()
  const [connected, setConnected] = useState(false)
  const token = options?.token
  const onEvent = options?.onEvent

  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let attempt = 0
    let stopped = false

    function startPollFallback() {
      if (pollTimer) return
      pollTimer = setInterval(() => router.refresh(), 5000)
    }
    function stopPollFallback() {
      if (!pollTimer) return
      clearInterval(pollTimer)
      pollTimer = null
    }

    function connect() {
      if (stopped) return
      const protocol = window.location.protocol === "https:" ? "wss" : "ws"
      const query = token ? `?token=${encodeURIComponent(token)}` : ""
      ws = new WebSocket(`${protocol}://${window.location.host}/ws${query}`)

      ws.onopen = () => {
        attempt = 0
        setConnected(true)
        stopPollFallback()
        router.refresh()
      }
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RealtimeEventPayload
          onEvent?.(data)
        } catch {
          // ignore malformed frames
        }
        router.refresh()
      }
      ws.onclose = () => {
        setConnected(false)
        if (stopped) return
        startPollFallback()
        attempt += 1
        const delay = Math.min(10_000, 1000 * 2 ** attempt)
        reconnectTimer = setTimeout(connect, delay)
      }
      ws.onerror = () => ws?.close()
    }

    connect()

    return () => {
      stopped = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      stopPollFallback()
      ws?.close()
    }
  }, [token, onEvent, router])

  return { connected }
}
