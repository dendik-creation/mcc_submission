import { desc } from "drizzle-orm"

// Relative imports — this module is also loaded from server.ts's raw
// Node/Bun bootstrap chain, outside Next's bundler (see comment there).
import { db } from "./client.ts"
import { competitions } from "./schema.ts"

/** MVP models a single active competition row (docs/05). Always the most
 * recently created one, so a future "reset for next event" just inserts a
 * new row rather than mutating history. */
export async function getActiveCompetition() {
  const [row] = await db
    .select()
    .from(competitions)
    .orderBy(desc(competitions.createdAt))
    .limit(1)
  return row ?? null
}
