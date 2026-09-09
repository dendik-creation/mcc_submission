import type { PgTransaction } from "drizzle-orm/pg-core"

import { db } from "@/lib/db/client"
import { auditLogs } from "@/lib/db/schema"

type AuditEntry = {
  actorUserId: string | null
  action: string
  targetType: string
  targetId?: string | null
  metadata?: Record<string, unknown>
}

/** Append-only audit trail. Pass `tx` when the entry must land in the same
 * transaction as the mutation it's recording (submission writes, score
 * finalize, timer control, results lock — docs/04). */
export async function logAudit(
  entry: AuditEntry,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx?: PgTransaction<any, any, any>,
) {
  const executor = tx ?? db
  await executor.insert(auditLogs).values({
    actorUserId: entry.actorUserId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId ?? null,
    metadata: entry.metadata ?? {},
  })
}
