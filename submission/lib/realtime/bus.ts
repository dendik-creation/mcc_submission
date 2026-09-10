import { EventEmitter } from "node:events"

// In-process pub/sub for the WebSocket gateway (server.ts). Single-instance
// MVP per docs/04 — a multi-instance deployment would need a shared bus
// (e.g. Postgres LISTEN/NOTIFY or Redis) instead of an EventEmitter.
export type RealtimeEvent =
  | { type: "timer_changed"; competitionId: string }
  | { type: "submission_received"; competitionId: string; submittedCount: number }
  | { type: "submission_updated"; competitionId: string; participantId: string }
  | { type: "status_changed"; competitionId: string }

declare global {
  var __submissionRealtimeBus: EventEmitter | undefined
}

const CHANNEL = "realtime"

// ponytail: always pin to globalThis — bridges the module boundary between
// server.ts (custom HTTP server) and the Next.js bundle. Without this,
// production builds get two separate EventEmitter instances and publish()
// events never reach the WS server's subscribe() handler.
export const realtimeBus = globalThis.__submissionRealtimeBus ?? new EventEmitter()
globalThis.__submissionRealtimeBus = realtimeBus
realtimeBus.setMaxListeners(0)

export function publish(event: RealtimeEvent) {
  realtimeBus.emit(CHANNEL, event)
}

export function subscribe(handler: (event: RealtimeEvent) => void) {
  realtimeBus.on(CHANNEL, handler)
  return () => realtimeBus.off(CHANNEL, handler)
}
