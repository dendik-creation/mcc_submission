import { eq } from "drizzle-orm"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ClipboardCheckIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/auth/session"
import { db } from "@/lib/db/client"
import { participants, scores } from "@/lib/db/schema"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function ScoringPage() {
  const actor = await getCurrentUser()
  // Layout already guards this route, but its auth check can be cached
  // independently of this page on a client-side navigation — never trust a
  // non-null assertion on session data across a page boundary.
  if (!actor || actor.role !== "judge") redirect("/login/juri")

  const allParticipants = await db
    .select()
    .from(participants)
    .where(eq(participants.registrationStatus, "registered"))
    .orderBy(participants.participantNumber)
  const myScores = await db.select().from(scores).where(eq(scores.judgeId, actor.id))
  const scoreByParticipant = new Map(myScores.map((s) => [s.participantId, s]))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Penilaian Saya</CardTitle>
      </CardHeader>
      <CardContent>
        {allParticipants.length === 0 ? (
          <EmptyState
            icon={ClipboardCheckIcon}
            title="Belum ada peserta untuk dinilai"
            description="Tambahkan peserta dulu di halaman Peserta sebelum mulai menilai."
            action={<Button render={<Link href="/admin/participants" />}>Kelola Peserta</Button>}
          />
        ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Status Nilai</TableHead>
                <TableHead>Skor</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allParticipants.map((participant) => {
                const score = scoreByParticipant.get(participant.id)
                return (
                  <TableRow key={participant.id}>
                    <TableCell>{participant.participantNumber}</TableCell>
                    <TableCell>{participant.fullName}</TableCell>
                    <TableCell>
                      {score ? (
                        <Badge variant={score.status === "final" ? "default" : "secondary"}>
                          {score.status === "final" ? "Final" : "Draft"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Belum dinilai</Badge>
                      )}
                    </TableCell>
                    <TableCell>{score ? Number(score.weightedTotal).toFixed(2) : "-"}</TableCell>
                    <TableCell>
                      <Button
                        render={<Link href={`/admin/scoring/${participant.id}`} />}
                        size="sm"
                        variant="outline"
                      >
                        {score ? "Edit" : "Nilai"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        )}
      </CardContent>
    </Card>
  )
}
