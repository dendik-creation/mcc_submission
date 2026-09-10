"use server"

import { randomBytes } from "node:crypto"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { logAudit } from "@/lib/audit"
import { getCurrentUser } from "@/lib/auth/session"
import { db } from "@/lib/db/client"
import { getActiveCompetition } from "@/lib/db/queries"
import { competitions } from "@/lib/db/schema"

async function requireJudge() {
  const actor = await getCurrentUser()
  if (!actor || actor.role !== "judge") throw new Error("Unauthorized")
  return actor
}

export type SettingsFormState = { error?: string; success?: boolean }

export async function updateCompetitionSettingsAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const actor = await requireJudge()
  const competition = await getActiveCompetition()
  if (!competition) return { error: "Lomba belum dikonfigurasi" }

  const name = String(formData.get("name") ?? "").trim()
  const scheduledStartAtRaw = String(formData.get("scheduledStartAt") ?? "")
  const scheduledEndAtRaw = String(formData.get("scheduledEndAt") ?? "")
  const thresholdMinutesRaw = String(formData.get("timerThresholdMinutes") ?? "")

  if (!name) return { error: "Nama lomba wajib diisi" }

  // datetime-local has no timezone — append WIB offset so Node parses as
  // Asia/Jakarta regardless of the server's system timezone (UTC on VPS).
  const parseWIB = (raw: string) => (raw ? new Date(raw + ":00+07:00") : null)
  const scheduledStartAt = parseWIB(scheduledStartAtRaw)
  const scheduledEndAt = parseWIB(scheduledEndAtRaw)
  const timerThresholdSeconds = thresholdMinutesRaw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Math.round(Number(part) * 60))
    .filter((seconds) => Number.isFinite(seconds) && seconds > 0)
    .sort((a, b) => b - a)

  if (timerThresholdSeconds.length === 0) {
    return { error: "Isi minimal satu ambang waktu (menit), pisahkan dengan koma" }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(competitions)
      .set({
        name,
        scheduledStartAt,
        scheduledEndAt,
        timerThresholdSeconds,
        updatedAt: new Date(),
      })
      .where(eq(competitions.id, competition.id))

    await logAudit(
      {
        actorUserId: actor.id,
        action: "competition.settings_update",
        targetType: "competition",
        targetId: competition.id,
        metadata: { name, scheduledStartAt, scheduledEndAt, timerThresholdSeconds },
      },
      tx,
    )
  })

  revalidatePath("/admin/settings")
  return { success: true }
}

export async function rotateProjectorTokenAction() {
  const actor = await requireJudge()
  const competition = await getActiveCompetition()
  if (!competition) throw new Error("Lomba belum dikonfigurasi")

  const newToken = randomBytes(16).toString("base64url")
  await db.transaction(async (tx) => {
    await tx
      .update(competitions)
      .set({ projectorToken: newToken, updatedAt: new Date() })
      .where(eq(competitions.id, competition.id))

    await logAudit(
      {
        actorUserId: actor.id,
        action: "competition.projector_token_rotate",
        targetType: "competition",
        targetId: competition.id,
      },
      tx,
    )
  })

  revalidatePath("/admin/settings")
  return newToken
}
