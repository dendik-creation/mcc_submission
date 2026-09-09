"use server"

import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

import { logAudit } from "@/lib/audit"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { createSession, destroySession, getCurrentUser } from "@/lib/auth/session"
import { db } from "@/lib/db/client"
import { participants, users } from "@/lib/db/schema"
import { checkRateLimit } from "@/lib/rate-limit"
import {
  judgeLoginSchema,
  participantFormSchema,
  participantLoginSchema,
} from "@/lib/validation"

export type LoginFormState = { error?: string }

export async function loginParticipantAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = participantLoginSchema.safeParse({
    participantNumber: formData.get("participantNumber"),
    password: formData.get("password"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" }
  }

  const rateLimit = checkRateLimit(
    `login:participant:${parsed.data.participantNumber}`,
    { limit: 5, windowMs: 60_000 },
  )
  if (!rateLimit.allowed) {
    return { error: "Terlalu banyak percobaan. Coba lagi sebentar lagi." }
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.loginIdentifier, parsed.data.participantNumber))
    .limit(1)

  if (!user || user.role !== "participant" || user.status === "disabled") {
    return { error: "Nomor peserta atau password salah" }
  }
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Nomor peserta atau password salah" }
  }

  await createSession(user.id)
  await logAudit({ actorUserId: user.id, action: "login", targetType: "user", targetId: user.id })
  redirect("/dashboard")
}

export async function loginJudgeAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = judgeLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" }
  }

  const rateLimit = checkRateLimit(`login:judge:${parsed.data.email}`, {
    limit: 5,
    windowMs: 60_000,
  })
  if (!rateLimit.allowed) {
    return { error: "Terlalu banyak percobaan. Coba lagi sebentar lagi." }
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.loginIdentifier, parsed.data.email))
    .limit(1)

  if (!user || user.role !== "judge" || user.status === "disabled") {
    return { error: "Email atau password salah" }
  }
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Email atau password salah" }
  }

  await createSession(user.id)
  await logAudit({ actorUserId: user.id, action: "login", targetType: "user", targetId: user.id })
  redirect("/admin")
}

export async function logoutAction() {
  const user = await getCurrentUser()
  await destroySession()
  if (user) {
    await logAudit({ actorUserId: user.id, action: "logout", targetType: "user", targetId: user.id })
  }
  redirect("/")
}

export type CreateParticipantState = { error?: string; fieldErrors?: Record<string, string> }

/** Admin-only: creates the login + profile for one participant (docs/02 —
 * "akun buatan panitia"). Used directly and by the CSV importer. */
export async function createParticipant(input: {
  participantNumber: string
  fullName: string
  nim: string
  contact?: string
  password: string
}) {
  const actor = await getCurrentUser()
  if (!actor || actor.role !== "judge") throw new Error("Unauthorized")

  const parsed = participantFormSchema.parse(input)
  const passwordHash = await hashPassword(parsed.password)

  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        role: "participant",
        loginIdentifier: parsed.participantNumber,
        passwordHash,
        displayName: parsed.fullName,
      })
      .returning()

    const [participant] = await tx
      .insert(participants)
      .values({
        userId: user.id,
        participantNumber: parsed.participantNumber,
        fullName: parsed.fullName,
        nim: parsed.nim,
        contact: parsed.contact ?? null,
      })
      .returning()

    await logAudit(
      {
        actorUserId: actor.id,
        action: "participant.create",
        targetType: "participant",
        targetId: participant.id,
        metadata: { participantNumber: parsed.participantNumber },
      },
      tx,
    )

    return participant
  })
}
