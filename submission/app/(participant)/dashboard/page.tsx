import { desc, eq } from "drizzle-orm"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth/session"
import { db } from "@/lib/db/client"
import { getActiveCompetition } from "@/lib/db/queries"
import { participants, submissionRevisions, submissions } from "@/lib/db/schema"
import { COMPETITION_STATE_LABEL, SUBMISSION_STATUS_LABEL } from "@/lib/labels"
import { isSubmissionWindowOpen, remainingMs as computeRemainingMs } from "@/lib/timer"
import { Countdown } from "@/components/countdown"
import { SubmissionForm } from "@/components/submission/submission-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  // Never trust the layout's cached auth check to guarantee a non-null
  // session on this page's own independent fetch (see admin/scoring pages).
  if (!user || user.role !== "participant") redirect("/login/peserta")

  const [participant] = await db
    .select()
    .from(participants)
    .where(eq(participants.userId, user.id))
    .limit(1)
  const competition = await getActiveCompetition()

  const submission = participant
    ? (
        await db
          .select()
          .from(submissions)
          .where(eq(submissions.participantId, participant.id))
          .limit(1)
      )[0]
    : undefined

  const revisions = submission
    ? await db
        .select()
        .from(submissionRevisions)
        .where(eq(submissionRevisions.submissionId, submission.id))
        .orderBy(desc(submissionRevisions.createdAt))
    : []

  const timerState = {
    state: competition?.state ?? ("not_started" as const),
    endsAt: competition?.endsAt ?? null,
    remainingMsSnapshot: competition?.remainingMsSnapshot ?? null,
  }
  const remaining = computeRemainingMs(timerState, new Date())
  const windowOpen =
    isSubmissionWindowOpen(timerState, new Date()) || Boolean(submission?.reopenedAt)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{competition?.name ?? "Lomba belum dikonfigurasi"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold tabular-nums">
            <Countdown remainingMs={remaining} state={timerState.state} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Status lomba: {COMPETITION_STATE_LABEL[timerState.state]}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submission Kamu</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {submission && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant={submission.status === "received" ? "default" : "secondary"}>
                {SUBMISSION_STATUS_LABEL[submission.status]}
              </Badge>
              <span className="text-muted-foreground">
                Terkirim {submission.submittedAt.toLocaleString("id-ID")}
              </span>
            </div>
          )}
          {submission?.reopenedAt && (
            <p className="text-sm text-amber-600">
              Admin membuka ulang submission ini — kamu bisa memperbarui link sekali lagi.
            </p>
          )}
          <SubmissionForm defaultUrl={submission?.url} disabled={!windowOpen} />
          {!windowOpen && (
            <p className="text-destructive text-sm">
              Waktu submission sudah berakhir. Hubungi Juri/Admin bila kamu butuh submit ulang.
            </p>
          )}
        </CardContent>
      </Card>

      {revisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Perubahan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {revisions.map((revision) => (
              <div key={revision.id} className="border-b pb-2 last:border-0">
                <p className="break-all">{revision.newUrl}</p>
                <p className="text-muted-foreground text-xs">
                  {revision.createdAt.toLocaleString("id-ID")}
                  {revision.reason ? ` — ${revision.reason}` : ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
