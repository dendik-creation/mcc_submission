"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { logAudit } from "@/lib/audit"
import { getCurrentUser } from "@/lib/auth/session"
import { db } from "@/lib/db/client"
import { getActiveCompetition } from "@/lib/db/queries"
import { competitions } from "@/lib/db/schema"
import { publish } from "@/lib/realtime/bus"
import { applyTimerAction, type TimerAction } from "@/lib/timer"

async function requireJudge() {
  const actor = await getCurrentUser()
  if (!actor || actor.role !== "judge") throw new Error("Unauthorized")
  return actor
}

async function runTimerAction(action: TimerAction, auditAction: string) {
  const actor = await requireJudge()
  const competition = await getActiveCompetition()
  if (!competition) throw new Error("Lomba belum dikonfigurasi")

  const now = new Date()
  const next = applyTimerAction(
    {
      state: competition.state,
      endsAt: competition.endsAt,
      remainingMsSnapshot: competition.remainingMsSnapshot,
    },
    action,
    now,
  )

  await db.transaction(async (tx) => {
    await tx
      .update(competitions)
      .set({
        state: next.state,
        endsAt: next.endsAt,
        remainingMsSnapshot: next.remainingMsSnapshot,
        updatedAt: now,
      })
      .where(eq(competitions.id, competition.id))

    await logAudit(
      {
        actorUserId: actor.id,
        action: auditAction,
        targetType: "competition",
        targetId: competition.id,
        metadata: { fromState: competition.state, toState: next.state },
      },
      tx,
    )
  })

  publish({ type: "timer_changed", competitionId: competition.id })
  publish({ type: "status_changed", competitionId: competition.id })
  revalidatePath("/admin")
  revalidatePath("/dashboard")
}

/** Starts against the configured `scheduledEndAt` (set on the Pengaturan
 * page) rather than a duration typed at click-time — the schedule is the
 * single source of truth for how long the competition runs. */
export async function startCompetitionAction() {
  const competition = await getActiveCompetition()
  if (!competition) throw new Error("Lomba belum dikonfigurasi")
  if (!competition.scheduledEndAt) {
    throw new Error("Atur jadwal waktu selesai di Pengaturan sebelum memulai lomba")
  }
  const durationMs = competition.scheduledEndAt.getTime() - Date.now()
  if (durationMs <= 0) {
    throw new Error("Waktu selesai yang dijadwalkan sudah lewat — perbarui jadwal di Pengaturan")
  }
  await runTimerAction({ type: "start", durationMs }, "timer.start")
}

export async function pauseCompetitionAction() {
  await runTimerAction({ type: "pause" }, "timer.pause")
}

export async function resumeCompetitionAction() {
  await runTimerAction({ type: "resume" }, "timer.resume")
}

export async function closeCompetitionAction() {
  await runTimerAction({ type: "close" }, "timer.close")
}

/** Lets an admin start a fresh run after a competition was closed —
 * "closed" would otherwise be a permanent dead end. Update the schedule in
 * Pengaturan before starting again if the old deadline has passed. */
export async function resetCompetitionAction() {
  await runTimerAction({ type: "reset" }, "timer.reset")
}
