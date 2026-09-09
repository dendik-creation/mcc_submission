"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { logAudit } from "@/lib/audit"
import { getCurrentUser } from "@/lib/auth/session"
import { db } from "@/lib/db/client"
import { resultSnapshots } from "@/lib/db/schema"
import { getLeaderboardData } from "@/lib/leaderboard"

async function requireJudge() {
  const actor = await getCurrentUser()
  if (!actor || actor.role !== "judge") throw new Error("Unauthorized")
  return actor
}

export async function lockResultsAction() {
  const actor = await requireJudge()

  const [active] = await db
    .select()
    .from(resultSnapshots)
    .where(eq(resultSnapshots.isActive, true))
    .limit(1)
  if (active) {
    throw new Error("Hasil sudah terkunci — buka kunci dulu untuk mengunci ulang")
  }

  const { ranked, incomplete, participantsById } = await getLeaderboardData()
  if (incomplete.length > 0) {
    throw new Error(
      `${incomplete.length} peserta belum memiliki nilai final lengkap dari seluruh juri aktif`,
    )
  }
  if (ranked.length === 0) {
    throw new Error("Belum ada peserta dengan nilai lengkap untuk dikunci")
  }

  const rankings = ranked.map((entry) => ({
    participantId: entry.participantId,
    participantNumber: participantsById.get(entry.participantId)?.participantNumber,
    fullName: participantsById.get(entry.participantId)?.fullName,
    rank: entry.rank,
    finalScore: entry.finalScore,
    avgCreativity: entry.avgCreativity,
    needsCommitteeDecision: entry.needsCommitteeDecision,
  }))
  const winners = rankings.filter((entry) => entry.rank <= 3)

  await db.transaction(async (tx) => {
    const [snapshot] = await tx
      .insert(resultSnapshots)
      .values({ lockedBy: actor.id, reason: null, rankings, winners, isActive: true })
      .returning()

    await logAudit(
      {
        actorUserId: actor.id,
        action: "results.lock",
        targetType: "result_snapshot",
        targetId: snapshot.id,
        metadata: { winnerCount: winners.length, participantCount: rankings.length },
      },
      tx,
    )
  })

  revalidatePath("/admin/results")
}

/** The only way to unlock: requires a reason, deactivates the current
 * snapshot (kept, never deleted), and re-opens scoring. The next lock
 * creates a brand new snapshot row (docs/05). */
export async function reopenResultsAction(reason: string) {
  const actor = await requireJudge()
  if (!reason.trim()) throw new Error("Alasan wajib diisi")

  const [active] = await db
    .select()
    .from(resultSnapshots)
    .where(eq(resultSnapshots.isActive, true))
    .limit(1)
  if (!active) throw new Error("Tidak ada hasil terkunci saat ini")

  await db.transaction(async (tx) => {
    await tx
      .update(resultSnapshots)
      .set({ isActive: false })
      .where(eq(resultSnapshots.id, active.id))

    await logAudit(
      {
        actorUserId: actor.id,
        action: "results.reopen",
        targetType: "result_snapshot",
        targetId: active.id,
        metadata: { reason: reason.trim() },
      },
      tx,
    )
  })

  revalidatePath("/admin/results")
  revalidatePath("/admin/scoring")
}
