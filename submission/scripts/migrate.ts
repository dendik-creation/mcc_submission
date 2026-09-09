import "../load-env.ts"

import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"

// A dedicated advisory lock so that if two app replicas ever boot at the
// same time, only one runs migrations while the other waits and proceeds
// once they're already applied (docs/04: "diterapkan satu kali per release").
const MIGRATION_LOCK_KEY = 483_921_001

async function main() {
  const connectionString =
    process.env.MIGRATIONS_DATABASE_URL ?? process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("MIGRATIONS_DATABASE_URL or DATABASE_URL must be set")
  }

  const pool = new Pool({ connectionString })
  const client = await pool.connect()
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_KEY])
    const db = drizzle(client)
    await migrate(db, { migrationsFolder: "./drizzle" })
    console.log("[migrate] migrations applied")
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_KEY])
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error("[migrate] failed:", error)
  process.exit(1)
})
