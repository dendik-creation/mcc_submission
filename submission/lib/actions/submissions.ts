"use server"

import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { logAudit } from "@/lib/audit"
import { getCurrentUser } from "@/lib/auth/session"
import { db } from "@/lib/db/client"
import { getActiveCompetition } from "@/lib/db/queries"
import { participants, submissionRevisions, submissions } from "@/lib/db/schema"
import { publish } from "@/lib/realtime/bus"
import { isSubmissionWindowOpen } from "@/lib/timer"
import { submissionFormSchema, submissionUrlSchema } from "@/lib/validation"

export type SubmitFormState = { error?: string; success?: boolean }

async function requireParticipantProfile(userId: string) {
  const [participant] = await db
    .select()
    .from(participants)
    .where(eq(participants.userId, userId))
    .limit(1)
  if (!participant) throw new Error("Profil peserta tidak ditemukan")
  return participant
}

async function requireJudge() {
  const actor = await getCurrentUser()
  if (!actor || actor.role !== "judge") throw new Error("Unauthorized")
  return actor
}

export async function submitUrlAction(
  _prevState: SubmitFormState,
  formData: FormData,
): Promise<SubmitFormState> {
  const user = await getCurrentUser()
  if (!user || user.role !== "participant") throw new Error("Unauthorized")

  const parsed = submissionFormSchema.safeParse({
    url: formData.get("url"),
    authenticityAck: formData.get("authenticityAck") === "on",
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" }
  }

  const participant = await requireParticipantProfile(user.id)
  const competition = await getActiveCompetition()
  if (!competition) return { error: "Lomba belum dikonfigurasi" }

  const now = new Date()
  const [existing] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.participantId, participant.id))
    .limit(1)

  const hasActiveReopen = Boolean(existing?.reopenedAt)
  const windowOpen = isSubmissionWindowOpen(
    {
      state: competition.state,
      endsAt: competition.endsAt,
      remainingMsSnapshot: competition.remainingMsSnapshot,
    },
    now,
  )

  if (!windowOpen && !hasActiveReopen) {
    return {
      error: "Waktu submission sudah berakhir. Hubungi Juri/Admin untuk membuka ulang.",
    }
  }

  const isOnTime = windowOpen
  const status = isOnTime ? "received" : "received_late"

  await db.transaction(async (tx) => {
    if (existing) {
      await tx.insert(submissionRevisions).values({
        submissionId: existing.id,
        oldUrl: existing.url,
        newUrl: parsed.data.url,
        changedBy: user.id,
        reason: hasActiveReopen ? existing.reopenReason : null,
      })
      await tx
        .update(submissions)
        .set({
          url: parsed.data.url,
          status,
          submittedAt: now,
          isOnTime,
          authenticityAck: parsed.data.authenticityAck,
          reopenedAt: null,
          reopenReason: null,
          reopenedBy: null,
          updatedAt: now,
        })
        .where(eq(submissions.id, existing.id))
    } else {
      await tx.insert(submissions).values({
        participantId: participant.id,
        url: parsed.data.url,
        status,
        submittedAt: now,
        isOnTime,
        authenticityAck: parsed.data.authenticityAck,
      })
    }

    await logAudit(
      {
        actorUserId: user.id,
        action: existing ? "submission.update" : "submission.create",
        targetType: "submission",
        targetId: existing?.id ?? participant.id,
        metadata: { url: parsed.data.url, status },
      },
      tx,
    )
  })

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(submissions)

  if (existing) {
    publish({
      type: "submission_updated",
      competitionId: competition.id,
      participantId: participant.id,
    })
  } else {
    publish({
      type: "submission_received",
      competitionId: competition.id,
      submittedCount: count,
    })
  }

  revalidatePath("/dashboard")
  revalidatePath("/admin/submissions")
  return { success: true }
}

/** Grants exactly one post-deadline update to a participant who already has
 * a submission (docs/02, point 6). Consumed automatically the next time
 * they submit. */
export async function reopenSubmissionAction(participantId: string, reason: string) {
  const actor = await requireJudge()
  if (!reason.trim()) throw new Error("Alasan wajib diisi")

  const [existing] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.participantId, participantId))
    .limit(1)
  if (!existing) {
    throw new Error("Peserta ini belum pernah submit — gunakan Catat Submission Manual")
  }

  await db.transaction(async (tx) => {
    await tx
      .update(submissions)
      .set({
        reopenedAt: new Date(),
        reopenReason: reason.trim(),
        reopenedBy: actor.id,
        updatedAt: new Date(),
      })
      .where(eq(submissions.id, existing.id))

    await logAudit(
      {
        actorUserId: actor.id,
        action: "submission.reopen",
        targetType: "submission",
        targetId: existing.id,
        metadata: { reason: reason.trim() },
      },
      tx,
    )
  })

  revalidatePath("/admin/submissions")
}

/** Manual/emergency entry for a participant who never got to submit at all
 * (docs/06 SOP — "internet bermasalah ... catat submission darurat"). */
export async function adminRecordSubmissionAction(input: {
  participantId: string
  url: string
  reason: string
  wasOnTime: boolean
}) {
  const actor = await requireJudge()
  if (!input.reason.trim()) throw new Error("Alasan wajib diisi")
  const url = submissionUrlSchema.parse(input.url)

  const [existing] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.participantId, input.participantId))
    .limit(1)
  if (existing) {
    throw new Error("Peserta ini sudah punya submission — gunakan Buka Ulang, bukan catat manual")
  }

  const now = new Date()
  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(submissions)
      .values({
        participantId: input.participantId,
        url,
        status: input.wasOnTime ? "received" : "received_late",
        submittedAt: now,
        isOnTime: input.wasOnTime,
        authenticityAck: true,
      })
      .returning()

    await tx.insert(submissionRevisions).values({
      submissionId: created.id,
      oldUrl: null,
      newUrl: url,
      changedBy: actor.id,
      reason: `Dicatat manual oleh admin: ${input.reason.trim()}`,
    })

    await logAudit(
      {
        actorUserId: actor.id,
        action: "submission.manual_record",
        targetType: "submission",
        targetId: created.id,
        metadata: { reason: input.reason.trim(), participantId: input.participantId },
      },
      tx,
    )
  })

  revalidatePath("/admin/submissions")
}

export async function setSubmissionAccessStatusAction(
  submissionId: string,
  status: "received" | "received_late" | "needs_fix" | "inaccessible",
) {
  const actor = await requireJudge()

  await db.transaction(async (tx) => {
    await tx
      .update(submissions)
      .set({ status, updatedAt: new Date() })
      .where(eq(submissions.id, submissionId))

    await logAudit(
      {
        actorUserId: actor.id,
        action: "submission.status_change",
        targetType: "submission",
        targetId: submissionId,
        metadata: { status },
      },
      tx,
    )
  })

  revalidatePath("/admin/submissions")
}
