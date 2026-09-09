export type CompetitionTimerState = {
  state: "not_started" | "running" | "paused" | "closed"
  endsAt: Date | null
  remainingMsSnapshot: number | null
}

export type TimerAction =
  | { type: "start"; durationMs: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "close" }
  | { type: "reset" }

export class TimerTransitionError extends Error {
  constructor(from: CompetitionTimerState["state"], action: TimerAction["type"]) {
    super(`Cannot ${action} a competition in state "${from}"`)
    this.name = "TimerTransitionError"
  }
}

/** Pure state transition — the only place that decides what a timer control
 * action does to the competition row. Server actions call this then persist
 * the result inside a transaction alongside the audit log entry. */
export function applyTimerAction(
  current: CompetitionTimerState,
  action: TimerAction,
  now: Date,
): CompetitionTimerState {
  switch (action.type) {
    case "start": {
      if (current.state !== "not_started") {
        throw new TimerTransitionError(current.state, action.type)
      }
      return {
        state: "running",
        endsAt: new Date(now.getTime() + action.durationMs),
        remainingMsSnapshot: null,
      }
    }
    case "pause": {
      if (current.state !== "running" || !current.endsAt) {
        throw new TimerTransitionError(current.state, action.type)
      }
      const remaining = Math.max(0, current.endsAt.getTime() - now.getTime())
      return { state: "paused", endsAt: null, remainingMsSnapshot: remaining }
    }
    case "resume": {
      if (current.state !== "paused" || current.remainingMsSnapshot === null) {
        throw new TimerTransitionError(current.state, action.type)
      }
      return {
        state: "running",
        endsAt: new Date(now.getTime() + current.remainingMsSnapshot),
        remainingMsSnapshot: null,
      }
    }
    case "close": {
      if (current.state !== "running" && current.state !== "paused") {
        throw new TimerTransitionError(current.state, action.type)
      }
      return { state: "closed", endsAt: null, remainingMsSnapshot: null }
    }
    case "reset": {
      // Only from "closed" — lets an admin start a new run (rehearsal,
      // retry) instead of "closed" being a permanent dead end.
      if (current.state !== "closed") {
        throw new TimerTransitionError(current.state, action.type)
      }
      return { state: "not_started", endsAt: null, remainingMsSnapshot: null }
    }
  }
}

export function remainingMs(state: CompetitionTimerState, now: Date): number {
  if (state.state === "running" && state.endsAt) {
    return Math.max(0, state.endsAt.getTime() - now.getTime())
  }
  if (state.state === "paused" && state.remainingMsSnapshot !== null) {
    return state.remainingMsSnapshot
  }
  return 0
}

/** Server-authoritative gate used by the submission Server Action — the
 * browser's countdown is only ever a display of this, never the source of
 * truth (docs/03). */
export function isSubmissionWindowOpen(
  state: CompetitionTimerState,
  now: Date,
): boolean {
  return state.state === "running" && remainingMs(state, now) > 0
}
