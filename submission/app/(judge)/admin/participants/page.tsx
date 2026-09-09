import { desc } from "drizzle-orm"

import { db } from "@/lib/db/client"
import { participants, submissions } from "@/lib/db/schema"
import { AddParticipantDialog } from "@/components/admin/add-participant-dialog"
import { CsvImportDialog } from "@/components/admin/csv-import-dialog"
import { ParticipantsTable } from "@/components/admin/participants-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ParticipantsPage() {
  const allParticipants = await db
    .select()
    .from(participants)
    .orderBy(desc(participants.createdAt))
  const allSubmissions = await db.select({ participantId: submissions.participantId }).from(submissions)
  const submittedIds = new Set(allSubmissions.map((s) => s.participantId))

  const rows = allParticipants.map((participant) => ({
    id: participant.id,
    participantNumber: participant.participantNumber,
    fullName: participant.fullName,
    nim: participant.nim,
    contact: participant.contact,
    registrationStatus: participant.registrationStatus,
    hasSubmission: submittedIds.has(participant.id),
  }))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Daftar Peserta ({rows.length})</CardTitle>
        <div className="flex gap-2">
          <CsvImportDialog />
          <AddParticipantDialog />
        </div>
      </CardHeader>
      <CardContent>
        <ParticipantsTable rows={rows} />
      </CardContent>
    </Card>
  )
}
