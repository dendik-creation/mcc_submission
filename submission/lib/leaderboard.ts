import { and, eq } from "drizzle-orm"

import { db } from "@/lib/db/client"
import { participants, scores, submissions, users } from "@/lib/db/schema"
import { averageFinalScore } from "@/lib/scoring"
import { rankParticipants, type RankedEntry } from "@/lib/tie-breaker"

export type IncompleteEntry = {
  participantId: string
  fullName: string
  participantNumber: string
  scoredBy: number
  totalJudges: number
  hasSubmission: boolean
}

export type LeaderboardData = {
  ranked: RankedEntry[]
  incomplete: IncompleteEntry[]
  participantsById: Map<string, typeof participants.$inferSelect>
}

/** Internal only (docs/02 — leaderboard never reaches peserta/proyektor).
 * A participant only makes the ranked list once every active judge has
 * given them a *final* score; otherwise they land in `incomplete`. */
export async function getLeaderboardData(): Promise<LeaderboardData> {
  const activeJudges = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "judge"), eq(users.status, "active")))
  const activeJudgeIds = new Set(activeJudges.map((j) => j.id))

  const allParticipants = await db
    .select()
    .from(participants)
    .where(eq(participants.registrationStatus, "registered"))
  const finalScores = await db.select().from(scores).where(eq(scores.status, "final"))
  const allSubmissions = await db.select().from(submissions)

  const participantsById = new Map(allParticipants.map((p) => [p.id, p]))
  const submissionByParticipant = new Map(allSubmissions.map((s) => [s.participantId, s]))

  const scoresByParticipant = new Map<string, typeof finalScores>()
  for (const score of finalScores) {
    if (!activeJudgeIds.has(score.judgeId)) continue
    const list = scoresByParticipant.get(score.participantId) ?? []
    list.push(score)
    scoresByParticipant.set(score.participantId, list)
  }

  const complete: Parameters<typeof rankParticipants>[0] = []
  const incomplete: IncompleteEntry[] = []

  for (const participant of allParticipants) {
    const participantScores = scoresByParticipant.get(participant.id) ?? []
    const submission = submissionByParticipant.get(participant.id)
    const isComplete =
      activeJudgeIds.size > 0 &&
      participantScores.length >= activeJudgeIds.size &&
      Boolean(submission)

    if (!isComplete) {
      incomplete.push({
        participantId: participant.id,
        fullName: participant.fullName,
        participantNumber: participant.participantNumber,
        scoredBy: participantScores.length,
        totalJudges: activeJudgeIds.size,
        hasSubmission: Boolean(submission),
      })
      continue
    }

    const finalScore = averageFinalScore(
      participantScores.map((s) => Number(s.weightedTotal)),
    )
    const avgCreativity =
      participantScores.reduce((sum, s) => sum + s.criteriaCreativity, 0) /
      participantScores.length

    complete.push({
      participantId: participant.id,
      finalScore: finalScore!,
      avgCreativity,
      submittedAt: submission!.submittedAt,
    })
  }

  return { ranked: rankParticipants(complete), incomplete, participantsById }
}
