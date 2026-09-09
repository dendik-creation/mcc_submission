import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema.ts"

declare global {
  var __submissionDbPool: Pool | undefined
}

// `pg.Pool` doesn't connect until the first query, so it's safe to
// construct even when DATABASE_URL is unset — that's the case during
// `next build`'s page-data collection (no env vars, no live DB by design;
// docs/04 — migrations and real connections only happen at deploy/runtime).
// A genuinely missing DATABASE_URL at request time surfaces as a normal
// connection error from the first query instead.
function createPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL })
}

// Reused across hot-reloads in dev so we don't leak a new pool per reload.
const pool = globalThis.__submissionDbPool ?? createPool()
if (process.env.NODE_ENV !== "production") {
  globalThis.__submissionDbPool = pool
}

export const db = drizzle(pool, { schema })
