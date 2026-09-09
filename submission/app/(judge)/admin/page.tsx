import { and, eq, sql } from "drizzle-orm"
import { BarChart3Icon } from "lucide-react"

import { db } from "@/lib/db/client"
import { getActiveCompetition } from "@/lib/db/queries"
import { participants, scores, submissions, users } from "@/lib/db/schema"
import { COMPETITION_STATE_LABEL, SUBMISSION_STATUS_LABEL } from "@/lib/labels"
import { remainingMs as computeRemainingMs } from "@/lib/timer"
import { JudgeProgressChart } from "@/components/admin/judge-progress-chart"
import { SubmissionStatusChart } from "@/components/admin/submission-status-chart"
import { TimerControl } from "@/components/admin/timer-control"
import { Countdown } from "@/components/countdown"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminOverviewPage() {
  const competition = await getActiveCompetition()
  const [{ count: registeredCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(participants)
    .where(eq(participants.registrationStatus, "registered"))
  const [{ count: submittedCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(submissions)

  const statusCounts = await db
    .select({ status: submissions.status, count: sql<number>`count(*)::int` })
    .from(submissions)
    .groupBy(submissions.status)

  const statusChartData = [
    { status: "Belum submit", count: Math.max(0, registeredCount - submittedCount) },
    ...(Object.entries(SUBMISSION_STATUS_LABEL) as [keyof typeof SUBMISSION_STATUS_LABEL, string][]).map(
      ([key, label]) => ({
        status: label,
        count: statusCounts.find((row) => row.status === key)?.count ?? 0,
      }),
    ),
  ]

  const activeJudges = await db
    .select()
    .from(users)
    .where(and(eq(users.role, "judge"), eq(users.status, "active")))
  const finalScoreCounts = await db
    .select({ judgeId: scores.judgeId, count: sql<number>`count(*)::int` })
    .from(scores)
    .where(eq(scores.status, "final"))
    .groupBy(scores.judgeId)

  const judgeChartData = activeJudges.map((judge) => {
    const scored = finalScoreCounts.find((row) => row.judgeId === judge.id)?.count ?? 0
    return {
      judge: judge.displayName,
      scored,
      remaining: Math.max(0, registeredCount - scored),
    }
  })

  const timerState = {
    state: competition?.state ?? ("not_started" as const),
    endsAt: competition?.endsAt ?? null,
    remainingMsSnapshot: competition?.remainingMsSnapshot ?? null,
  }
  const remaining = computeRemainingMs(timerState, new Date())
  const boardUrl = competition ? `/board/${competition.projectorToken}` : null

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{competition?.name ?? "Lomba belum dikonfigurasi"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="text-4xl font-bold tabular-nums">
            <Countdown remainingMs={remaining} state={timerState.state} />
          </div>
          <p className="text-muted-foreground text-sm">
            Status: {COMPETITION_STATE_LABEL[timerState.state]}
          </p>
          {competition ? (
            <TimerControl state={competition.state} />
          ) : (
            <p className="text-destructive text-sm">Buat konfigurasi lomba dulu di Pengaturan.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Peserta Terdaftar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{registeredCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Submission Masuk
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {submittedCount}/{registeredCount}
          </CardContent>
        </Card>
        {boardUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-normal">
                Live Board
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a href={boardUrl} target="_blank" rel="noreferrer" className="text-sm underline">
                {boardUrl}
              </a>
            </CardContent>
          </Card>
        )}
      </div>

      {registeredCount === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={BarChart3Icon}
              title="Belum ada data untuk divisualisasikan"
              description="Grafik status submission dan progres penilaian muncul setelah ada peserta terdaftar."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Status Submission</CardTitle>
            </CardHeader>
            <CardContent>
              <SubmissionStatusChart data={statusChartData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Progres Penilaian per Juri</CardTitle>
            </CardHeader>
            <CardContent>
              {judgeChartData.length === 0 ? (
                <EmptyState icon={BarChart3Icon} title="Belum ada akun juri aktif" />
              ) : (
                <JudgeProgressChart data={judgeChartData} />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
