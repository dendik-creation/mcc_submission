import { describe, expect, it } from "vitest"

import {
  applyTimerAction,
  isSubmissionWindowOpen,
  remainingMs,
  TimerTransitionError,
  type CompetitionTimerState,
} from "./timer"

const notStarted: CompetitionTimerState = {
  state: "not_started",
  endsAt: null,
  remainingMsSnapshot: null,
}

describe("applyTimerAction", () => {
  it("starts a not_started competition with an ends_at durationMs away", () => {
    const now = new Date("2026-01-01T10:00:00Z")
    const next = applyTimerAction(notStarted, { type: "start", durationMs: 60_000 }, now)
    expect(next.state).toBe("running")
    expect(next.endsAt?.toISOString()).toBe("2026-01-01T10:01:00.000Z")
  })

  it("rejects starting a competition that already started", () => {
    const running: CompetitionTimerState = {
      state: "running",
      endsAt: new Date("2026-01-01T11:00:00Z"),
      remainingMsSnapshot: null,
    }
    expect(() =>
      applyTimerAction(running, { type: "start", durationMs: 1000 }, new Date()),
    ).toThrow(TimerTransitionError)
  })

  it("pause captures remaining time and clears ends_at", () => {
    const running: CompetitionTimerState = {
      state: "running",
      endsAt: new Date("2026-01-01T10:10:00Z"),
      remainingMsSnapshot: null,
    }
    const now = new Date("2026-01-01T10:04:00Z")
    const next = applyTimerAction(running, { type: "pause" }, now)
    expect(next.state).toBe("paused")
    expect(next.endsAt).toBeNull()
    expect(next.remainingMsSnapshot).toBe(6 * 60_000)
  })

  it("resume re-anchors ends_at from the snapshot", () => {
    const paused: CompetitionTimerState = {
      state: "paused",
      endsAt: null,
      remainingMsSnapshot: 6 * 60_000,
    }
    const now = new Date("2026-01-01T12:00:00Z")
    const next = applyTimerAction(paused, { type: "resume" }, now)
    expect(next.state).toBe("running")
    expect(next.endsAt?.toISOString()).toBe("2026-01-01T12:06:00.000Z")
  })

  it("close works from running or paused, never from not_started", () => {
    const running: CompetitionTimerState = {
      state: "running",
      endsAt: new Date(),
      remainingMsSnapshot: null,
    }
    expect(applyTimerAction(running, { type: "close" }, new Date()).state).toBe("closed")
    expect(() => applyTimerAction(notStarted, { type: "close" }, new Date())).toThrow(
      TimerTransitionError,
    )
  })

  it("reset returns a closed competition to not_started so it can run again", () => {
    const closed: CompetitionTimerState = { state: "closed", endsAt: null, remainingMsSnapshot: null }
    const next = applyTimerAction(closed, { type: "reset" }, new Date())
    expect(next).toEqual(notStarted)
  })

  it("reset is only valid from closed", () => {
    expect(() => applyTimerAction(notStarted, { type: "reset" }, new Date())).toThrow(
      TimerTransitionError,
    )
    const running: CompetitionTimerState = {
      state: "running",
      endsAt: new Date(),
      remainingMsSnapshot: null,
    }
    expect(() => applyTimerAction(running, { type: "reset" }, new Date())).toThrow(
      TimerTransitionError,
    )
  })
})

describe("isSubmissionWindowOpen / remainingMs", () => {
  it("is open only while running and before ends_at", () => {
    const now = new Date("2026-01-01T10:00:00Z")
    const running: CompetitionTimerState = {
      state: "running",
      endsAt: new Date("2026-01-01T10:00:01Z"),
      remainingMsSnapshot: null,
    }
    expect(isSubmissionWindowOpen(running, now)).toBe(true)

    const justClosed: CompetitionTimerState = {
      state: "running",
      endsAt: new Date("2026-01-01T09:59:59Z"),
      remainingMsSnapshot: null,
    }
    expect(isSubmissionWindowOpen(justClosed, now)).toBe(false)
  })

  it("rejects submissions while paused even with time left", () => {
    const paused: CompetitionTimerState = {
      state: "paused",
      endsAt: null,
      remainingMsSnapshot: 60_000,
    }
    expect(isSubmissionWindowOpen(paused, new Date())).toBe(false)
    expect(remainingMs(paused, new Date())).toBe(60_000)
  })
})
