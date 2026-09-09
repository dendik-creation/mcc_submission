"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { createParticipant } from "@/lib/actions/auth"
import { logAudit } from "@/lib/audit"
import { getCurrentUser } from "@/lib/auth/session"
import { parseParticipantCsv, type ParticipantCsvRow } from "@/lib/csv"
import { db } from "@/lib/db/client"
import { participants, users } from "@/lib/db/schema"

async function requireJudge() {
  const user = await getCurrentUser()
  if (!user || user.role !== "judge") throw new Error("Unauthorized")
  return user
}

export type CreateParticipantFormState = { error?: string; success?: boolean }

export async function createParticipantAction(
  _prevState: CreateParticipantFormState,
  formData: FormData,
): Promise<CreateParticipantFormState> {
  await requireJudge()
  try {
    await createParticipant({
      participantNumber: String(formData.get("participantNumber") ?? ""),
      fullName: String(formData.get("fullName") ?? ""),
      nim: String(formData.get("nim") ?? ""),
      contact: String(formData.get("contact") ?? "") || undefined,
      password: String(formData.get("password") ?? ""),
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal membuat peserta" }
  }
  revalidatePath("/admin/participants")
  return { success: true }
}

export type ImportCsvResult = {
  imported: { participantNumber: string; fullName: string; password: string }[]
  errors: { line: number; message: string }[]
}

export async function importParticipantsCsvAction(
  formData: FormData,
): Promise<ImportCsvResult> {
  await requireJudge()

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return { imported: [], errors: [{ line: 0, message: "File CSV tidak ditemukan" }] }
  }

  const content = await file.text()
  const parsed = parseParticipantCsv(content)
  const errors = [...parsed.errors]
  const imported: ImportCsvResult["imported"] = []

  for (const [index, row] of parsed.rows.entries()) {
    const line = index + 2
    try {
      await createParticipant(row as ParticipantCsvRow)
      imported.push({
        participantNumber: row.participantNumber,
        fullName: row.fullName,
        password: row.password,
      })
    } catch (error) {
      errors.push({
        line,
        message: error instanceof Error ? error.message : "Gagal menyimpan baris ini",
      })
    }
  }

  revalidatePath("/admin/participants")
  return { imported, errors }
}

export async function setParticipantStatusAction(
  participantId: string,
  status: "registered" | "disabled",
) {
  const actor = await requireJudge()

  await db.transaction(async (tx) => {
    const [participant] = await tx
      .update(participants)
      .set({ registrationStatus: status, updatedAt: new Date() })
      .where(eq(participants.id, participantId))
      .returning()

    if (!participant) throw new Error("Peserta tidak ditemukan")

    await tx
      .update(users)
      .set({ status: status === "disabled" ? "disabled" : "active", updatedAt: new Date() })
      .where(eq(users.id, participant.userId))

    await logAudit(
      {
        actorUserId: actor.id,
        action: status === "disabled" ? "participant.disable" : "participant.reactivate",
        targetType: "participant",
        targetId: participantId,
      },
      tx,
    )
  })

  revalidatePath("/admin/participants")
}
