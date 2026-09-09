import { eq } from "drizzle-orm"

import { db } from "@/lib/db/client"
import { participants, submissions } from "@/lib/db/schema"
import { SubmissionsTable } from "@/components/admin/submissions-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SubmissionsPage() {
  const rows = await db
    .select({ participant: participants, submission: submissions })
    .from(participants)
    .leftJoin(submissions, eq(submissions.participantId, participants.id))
    .where(eq(participants.registrationStatus, "registered"))
    .orderBy(participants.participantNumber)

  const tableRows = rows.map(({ participant, submission }) => ({
    participantId: participant.id,
    participantNumber: participant.participantNumber,
    fullName: participant.fullName,
    submission: submission
      ? {
          id: submission.id,
          url: submission.url,
          status: submission.status,
          submittedAt: submission.submittedAt.toISOString(),
          reopenedAt: submission.reopenedAt ? submission.reopenedAt.toISOString() : null,
        }
      : null,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission Peserta ({tableRows.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <SubmissionsTable rows={tableRows} />
      </CardContent>
    </Card>
  )
}
