import { createHash } from "node:crypto"
import { eq } from "drizzle-orm"

// Relative imports, no "next/*" imports anywhere in this file: it's loaded
// from server.ts's raw Node/Bun bootstrap chain (the WebSocket upgrade
// handler), outside Next's bundler, where "next/headers" cannot resolve.
// Next-only session helpers (cookies()-based) live in session.ts instead.
import { db } from "../db/client.ts"
import { sessions, users } from "../db/schema.ts"

export const SESSION_COOKIE = "submission_session"
export const SESSION_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours — a competition day.

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export type SessionUser = {
  id: string
  role: "participant" | "judge"
  loginIdentifier: string
  displayName: string
  status: "active" | "disabled"
}

/** Shared by the HTTP session helper (session.ts) and the WebSocket upgrade
 * handler in server.ts, which only has the raw cookie header to work with. */
export async function getUserByToken(token: string): Promise<SessionUser | null> {
  const id = hashToken(token)
  const [row] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      role: users.role,
      loginIdentifier: users.loginIdentifier,
      displayName: users.displayName,
      status: users.status,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, id))
    .limit(1)

  if (!row) return null
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, id))
    return null
  }
  if (row.status === "disabled") return null

  return {
    id: row.userId,
    role: row.role,
    loginIdentifier: row.loginIdentifier,
    displayName: row.displayName,
    status: row.status,
  }
}

export function extractSessionToken(cookieHeader: string | undefined) {
  if (!cookieHeader) return null
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
  return match ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)) : null
}
