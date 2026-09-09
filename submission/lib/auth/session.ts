import { randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db/client"
import { sessions } from "@/lib/db/schema"
import {
  extractSessionToken,
  getUserByToken,
  hashToken,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  type SessionUser,
} from "@/lib/auth/session-core"

export type { SessionUser }
export { extractSessionToken, getUserByToken }

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url")
  const id = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await db.insert(sessions).values({ id, userId, expiresAt })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return getUserByToken(token)
}

export async function destroySession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, hashToken(token)))
  }
  cookieStore.delete(SESSION_COOKIE)
}

export async function destroyAllSessionsForUser(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId))
}
