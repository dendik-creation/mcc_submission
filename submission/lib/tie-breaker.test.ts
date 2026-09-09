import { describe, expect, it } from "vitest"

import { rankParticipants, type LeaderboardEntry } from "./tie-breaker"

function entry(
  id: string,
  finalScore: number,
  avgCreativity: number,
  submittedAt: string,
): LeaderboardEntry {
  return { participantId: id, finalScore, avgCreativity, submittedAt: new Date(submittedAt) }
}

describe("rankParticipants", () => {
  it("ranks purely by final score when there are no ties", () => {
    const ranked = rankParticipants([
      entry("a", 70, 5, "2026-01-01T10:00:00Z"),
      entry("b", 90, 5, "2026-01-01T10:00:00Z"),
      entry("c", 80, 5, "2026-01-01T10:00:00Z"),
    ])
    expect(ranked.map((r) => r.participantId)).toEqual(["b", "c", "a"])
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3])
    expect(ranked.every((r) => r.tieBreakLevel === 0)).toBe(true)
  })

  it("breaks a score tie with creativity", () => {
    const ranked = rankParticipants([
      entry("a", 80, 6, "2026-01-01T10:00:00Z"),
      entry("b", 80, 9, "2026-01-01T10:00:00Z"),
    ])
    expect(ranked.map((r) => r.participantId)).toEqual(["b", "a"])
    expect(ranked[1].tieBreakLevel).toBe(1)
    expect(ranked[1].needsCommitteeDecision).toBe(false)
  })

  it("breaks a score+creativity tie with earliest submission", () => {
    const ranked = rankParticipants([
      entry("a", 80, 8, "2026-01-01T10:05:00Z"),
      entry("b", 80, 8, "2026-01-01T09:00:00Z"),
    ])
    expect(ranked.map((r) => r.participantId)).toEqual(["b", "a"])
    expect(ranked[1].tieBreakLevel).toBe(2)
  })

  it("flags a full tie for committee decision and gives equal rank", () => {
    const ranked = rankParticipants([
      entry("a", 80, 8, "2026-01-01T10:00:00Z"),
      entry("b", 80, 8, "2026-01-01T10:00:00Z"),
      entry("c", 60, 5, "2026-01-01T11:00:00Z"),
    ])
    const [first, second, third] = ranked
    expect(first.rank).toBe(1)
    expect(second.rank).toBe(1)
    expect(second.needsCommitteeDecision).toBe(true)
    expect(first.needsCommitteeDecision).toBe(true)
    expect(third.rank).toBe(3)
  })
})
