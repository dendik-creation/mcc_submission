"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { logAudit } from "@/lib/audit"
import { getCurrentUser } from "@/lib/auth/session"
import { db } from "@/lib/db/client"
import { resultSnapshots, scores } from "@/lib/db/schema"
import { computeWeightedTotal } from "@/lib/scoring"
import { scoreFormSchema } from "@/lib/validation"

async function requireJudge() {
  const actor = await getCurrentUser()
  if (!actor || actor.role !== "judge") throw new Error("Unauthorized")
  return actor
}

async function isResultsLocked() {
  const [active] = await db
    .select()
    .from(resultSnapshots)
    .where(eq(resultSnapshots.isActive, true))
    .limit(1)
  return Boolean(active)
}

export type ScoreFormState = { error?: string; success?: boolean }

export async function saveScoreAction(
  _prevState: ScoreFormState,
  formData: FormData,
): Promise<ScoreFormState> {
  const actor = await requireJudge()

  const parsed = scoreFormSchema.safeParse({
    participantId: formData.get("participantId"),
    theme: Number(formData.get("theme")),
    design: Number(formData.get("design")),
    functionality: Number(formData.get("functionality")),
    creativity: Number(formData.get("creativity")),
    aiUsage: Number(formData.get("aiUsage")),
    notes: formData.get("notes") || undefined,
    status: formData.get("status"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" }
  }

  // Juri hanya boleh mengubah nilainya sendiri sebelum hasil dikunci (docs/02).
  if (await isResultsLocked()) {
    return { error: "Hasil sudah dikunci. Admin perlu membuka kunci hasil dulu." }
  }

  const weightedTotal = computeWeightedTotal(parsed.data)

  await db.transaction(async (tx) => {
    await tx
      .insert(scores)
      .values({
        judgeId: actor.id,
        participantId: parsed.data.participantId,
        criteriaTheme: parsed.data.theme,
        criteriaDesign: parsed.data.design,
        criteriaFunctionality: parsed.data.functionality,
        criteriaCreativity: parsed.data.creativity,
        criteriaAiUsage: parsed.data.aiUsage,
        weightedTotal: weightedTotal.toFixed(2),
        notes: parsed.data.notes ?? null,
        status: parsed.data.status,
      })
      .onConflictDoUpdate({
        target: [scores.judgeId, scores.participantId],
        set: {
          criteriaTheme: parsed.data.theme,
          criteriaDesign: parsed.data.design,
          criteriaFunctionality: parsed.data.functionality,
          criteriaCreativity: parsed.data.creativity,
          criteriaAiUsage: parsed.data.aiUsage,
          weightedTotal: weightedTotal.toFixed(2),
          notes: parsed.data.notes ?? null,
          status: parsed.data.status,
          updatedAt: new Date(),
        },
      })

    await logAudit(
      {
        actorUserId: actor.id,
        action: parsed.data.status === "final" ? "score.finalize" : "score.draft",
        targetType: "score",
        targetId: parsed.data.participantId,
        metadata: { weightedTotal, status: parsed.data.status },
      },
      tx,
    )
  })

  revalidatePath("/admin/scoring")
  revalidatePath(`/admin/scoring/${parsed.data.participantId}`)
  return { success: true }
}
