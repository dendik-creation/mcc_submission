import { eq, sql } from "drizzle-orm"
import { notFound } from "next/navigation"

import { db } from "@/lib/db/client"
import { competitions, participants, submissions } from "@/lib/db/schema"
import { remainingMs as computeRemainingMs } from "@/lib/timer"
import { ProjectorBoard } from "@/components/board/projector-board"

export default async function BoardPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const [competition] = await db
    .select()
    .from(competitions)
    .where(eq(competitions.projectorToken, token))
    .limit(1)
  if (!competition) notFound()

  const [{ count: registeredCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(participants)
    .where(eq(participants.registrationStatus, "registered"))
  const [{ count: submittedCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(submissions)

  const remaining = computeRemainingMs(
    {
      state: competition.state,
      endsAt: competition.endsAt,
      remainingMsSnapshot: competition.remainingMsSnapshot,
    },
    new Date(),
  )

  return (
    <ProjectorBoard
      token={token}
      name={competition.name}
      state={competition.state}
      remainingMs={remaining}
      thresholdSeconds={competition.timerThresholdSeconds}
      registeredCount={registeredCount}
      submittedCount={submittedCount}
    />
  )
}
