export type LeaderboardEntry = {
  participantId: string
  finalScore: number
  avgCreativity: number
  submittedAt: Date
}

export type RankedEntry = LeaderboardEntry & {
  rank: number
  /** How this entry's position relative to the previous one was decided:
   * 0 = final score differed, 1 = creativity broke a score tie,
   * 2 = submission timestamp broke a score+creativity tie,
   * 3 = still tied on every rule — needs a committee decision (docs/05). */
  tieBreakLevel: 0 | 1 | 2 | 3
  needsCommitteeDecision: boolean
}

/** Applies the ordered tie-breaker rules from docs/05-data-and-rules.md:
 * 1) highest final score, 2) highest avg Kreativitas & Orisinalitas,
 * 3) earliest active-submission timestamp, 4) unresolved -> committee. */
export function rankParticipants(entries: LeaderboardEntry[]): RankedEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore
    if (b.avgCreativity !== a.avgCreativity)
      return b.avgCreativity - a.avgCreativity
    return a.submittedAt.getTime() - b.submittedAt.getTime()
  })

  const ranked: RankedEntry[] = []
  for (let index = 0; index < sorted.length; index += 1) {
    const entry = sorted[index]
    const prev = ranked[index - 1]

    if (!prev) {
      ranked.push({ ...entry, rank: 1, tieBreakLevel: 0, needsCommitteeDecision: false })
      continue
    }

    const sameScore = prev.finalScore === entry.finalScore
    const sameCreativity = prev.avgCreativity === entry.avgCreativity
    const sameTimestamp = prev.submittedAt.getTime() === entry.submittedAt.getTime()

    let tieBreakLevel: RankedEntry["tieBreakLevel"] = 0
    if (sameScore && sameCreativity && sameTimestamp) tieBreakLevel = 3
    else if (sameScore && sameCreativity) tieBreakLevel = 2
    else if (sameScore) tieBreakLevel = 1

    const rank = tieBreakLevel === 3 ? prev.rank : index + 1

    ranked.push({
      ...entry,
      rank,
      tieBreakLevel,
      needsCommitteeDecision: tieBreakLevel === 3,
    })
  }

  // A full tie only marks the *later* entry in the pair above; propagate the
  // flag to every member of the tied group (they all share `rank`).
  const tiedRanks = new Set(
    ranked.filter((r) => r.needsCommitteeDecision).map((r) => r.rank),
  )
  for (const entry of ranked) {
    if (tiedRanks.has(entry.rank)) entry.needsCommitteeDecision = true
  }

  return ranked
}
