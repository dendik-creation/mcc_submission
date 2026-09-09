import "../load-env.ts"

import { randomBytes } from "node:crypto"

// Relative imports so this script runs under plain `node` too (no bundler
// to resolve "@/..." aliases) — same reasoning as server.ts.
import { db } from "../lib/db/client.ts"
import { competitions, users } from "../lib/db/schema.ts"
import { hashPassword } from "../lib/auth/password.ts"

// See docs/DECISIONS.md — these are placeholders the committee must review
// and change (schedule + passwords) before a real event.
const JUDGES = [
  { email: "juri1@mcc2026.local", displayName: "Juri 1 (Admin)", password: "ganti-password-1" },
  { email: "juri2@mcc2026.local", displayName: "Juri 2", password: "ganti-password-2" },
]

async function main() {
  for (const judge of JUDGES) {
    const passwordHash = await hashPassword(judge.password)
    await db
      .insert(users)
      .values({
        role: "judge",
        loginIdentifier: judge.email,
        passwordHash,
        displayName: judge.displayName,
      })
      .onConflictDoNothing({ target: users.loginIdentifier })
  }

  const [existing] = await db.select().from(competitions).limit(1)
  if (!existing) {
    await db.insert(competitions).values({
      name: "Vibe Code Competition MCC 2026",
      state: "not_started",
      projectorToken: randomBytes(16).toString("base64url"),
    })
  }

  console.log("[seed] done — 2 judge accounts + placeholder competition ready")
  console.log("[seed] REVIEW docs/DECISIONS.md before a real event: schedule + passwords are placeholders")
}

main()
  .catch((error) => {
    console.error("[seed] failed:", error)
    process.exit(1)
  })
  .finally(() => process.exit(0))
