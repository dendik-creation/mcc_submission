export const SCORE_WEIGHTS = {
  theme: 25,
  design: 25,
  functionality: 25,
  creativity: 15,
  aiUsage: 10,
} as const

export type CriteriaScores = {
  theme: number
  design: number
  functionality: number
  creativity: number
  aiUsage: number
}

export const CRITERIA_MIN = 1
export const CRITERIA_MAX = 10

/** (nilai / 10) * bobot, summed — max 100 when every criterion is 10
 * (docs/05). Rounded to 2 decimals to match the numeric(5,2) DB column. */
export function computeWeightedTotal(scores: CriteriaScores): number {
  const total =
    (scores.theme / 10) * SCORE_WEIGHTS.theme +
    (scores.design / 10) * SCORE_WEIGHTS.design +
    (scores.functionality / 10) * SCORE_WEIGHTS.functionality +
    (scores.creativity / 10) * SCORE_WEIGHTS.creativity +
    (scores.aiUsage / 10) * SCORE_WEIGHTS.aiUsage
  return Math.round(total * 100) / 100
}

/** Final score for a participant = average of every judge's *final*
 * (non-draft) weighted total. Returns null when there are no final scores
 * yet, so callers can exclude the participant from the leaderboard
 * (docs/02: incomplete participants don't make the final leaderboard). */
export function averageFinalScore(finalWeightedTotals: number[]): number | null {
  if (finalWeightedTotals.length === 0) return null
  const sum = finalWeightedTotals.reduce((acc, value) => acc + value, 0)
  return Math.round((sum / finalWeightedTotals.length) * 100) / 100
}
