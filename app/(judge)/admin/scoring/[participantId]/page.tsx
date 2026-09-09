import { and, eq } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth/session"
import { db } from "@/lib/db/client"
import { participants, resultSnapshots, scores, submissions } from "@/lib/db/schema"
import { ScoreForm } from "@/components/admin/score-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ScoreParticipantPage({
  params,
}: {
  params: Promise<{ participantId: string }>
}) {
  const { participantId } = await params
  const actor = await getCurrentUser()
  // See comment in ../page.tsx — never trust the layout's cached auth check
  // to guarantee a non-null session on this page's own independent fetch.
  if (!actor || actor.role !== "judge") redirect("/login/juri")

  const [participant] = await db
    .select()
    .from(participants)
    .where(eq(participants.id, participantId))
    .limit(1)
  if (!participant) notFound()

  const [submission] = await db
    .select()
    .from(submissions)
    .where(eq(submissions.participantId, participantId))
    .limit(1)
  const [existing] = await db
    .select()
    .from(scores)
    .where(and(eq(scores.judgeId, actor.id), eq(scores.participantId, participantId)))
    .limit(1)
  const [activeSnapshot] = await db
    .select()
    .from(resultSnapshots)
    .where(eq(resultSnapshots.isActive, true))
    .limit(1)

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {participant.fullName} ({participant.participantNumber})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submission ? (
            <a href={submission.url} target="_blank" rel="noreferrer" className="text-sm underline">
              Buka karya peserta
            </a>
          ) : (
            <p className="text-muted-foreground text-sm">Peserta ini belum submit.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Form Penilaian</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreForm
            participantId={participantId}
            locked={Boolean(activeSnapshot)}
            initial={
              existing
                ? {
                    theme: existing.criteriaTheme,
                    design: existing.criteriaDesign,
                    functionality: existing.criteriaFunctionality,
                    creativity: existing.criteriaCreativity,
                    aiUsage: existing.criteriaAiUsage,
                    notes: existing.notes,
                    status: existing.status,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
