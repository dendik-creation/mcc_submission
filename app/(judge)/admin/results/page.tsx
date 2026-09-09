import { desc, eq } from "drizzle-orm"
import { TrophyIcon } from "lucide-react"

import { db } from "@/lib/db/client"
import { resultSnapshots } from "@/lib/db/schema"
import { getLeaderboardData } from "@/lib/leaderboard"
import { Podium } from "@/components/admin/podium"
import { LockResultsButton, ReopenResultsButton } from "@/components/admin/results-controls"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type SnapshotRanking = {
  participantId: string
  participantNumber?: string
  fullName?: string
  rank: number
  finalScore: number
  avgCreativity: number
  needsCommitteeDecision: boolean
}

export default async function ResultsPage() {
  const [activeSnapshot] = await db
    .select()
    .from(resultSnapshots)
    .where(eq(resultSnapshots.isActive, true))
    .limit(1)
  const { ranked, incomplete, participantsById } = await getLeaderboardData()
  const previousSnapshots = await db
    .select()
    .from(resultSnapshots)
    .where(eq(resultSnapshots.isActive, false))
    .orderBy(desc(resultSnapshots.lockedAt))

  const rows: SnapshotRanking[] = activeSnapshot
    ? (activeSnapshot.rankings as SnapshotRanking[])
    : ranked.map((entry) => ({
        participantId: entry.participantId,
        participantNumber: participantsById.get(entry.participantId)?.participantNumber,
        fullName: participantsById.get(entry.participantId)?.fullName,
        rank: entry.rank,
        finalScore: entry.finalScore,
        avgCreativity: entry.avgCreativity,
        needsCommitteeDecision: entry.needsCommitteeDecision,
      }))

  const podiumRows = rows.filter((entry) => entry.rank <= 3)
  const restRows = rows.filter((entry) => entry.rank > 3)
  const podiumNeedsDecision = podiumRows.some((entry) => entry.needsCommitteeDecision)

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{activeSnapshot ? "Hasil Terkunci" : "Leaderboard (belum dikunci)"}</CardTitle>
          {activeSnapshot ? (
            <ReopenResultsButton />
          ) : (
            <LockResultsButton disabled={incomplete.length > 0 || ranked.length === 0} />
          )}
        </CardHeader>
        <CardContent>
          {!activeSnapshot && incomplete.length > 0 && (
            <p className="mb-4 text-sm text-amber-600">
              {incomplete.length} peserta belum punya nilai final lengkap dan tidak masuk daftar —
              lihat di bawah.
            </p>
          )}

          {rows.length === 0 ? (
            <EmptyState
              icon={TrophyIcon}
              title="Belum ada peringkat"
              description="Peringkat muncul setelah minimal satu peserta punya nilai final lengkap dari seluruh juri aktif."
            />
          ) : (
            <>
              <Podium entries={podiumRows} />
              {podiumNeedsDecision && (
                <p className="text-destructive mb-4 text-center text-sm">
                  Ada skor seri penuh di posisi 3 besar — perlu keputusan panitia (lihat tabel).
                </p>
              )}

              {restRows.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Peringkat</TableHead>
                        <TableHead>Peserta</TableHead>
                        <TableHead>Skor Akhir</TableHead>
                        <TableHead>Kreativitas</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {restRows.map((entry) => (
                        <TableRow key={entry.participantId}>
                          <TableCell>{entry.rank}</TableCell>
                          <TableCell>
                            {entry.fullName ?? entry.participantId}
                            {entry.participantNumber ? ` (${entry.participantNumber})` : ""}
                          </TableCell>
                          <TableCell>{Number(entry.finalScore).toFixed(2)}</TableCell>
                          <TableCell>{Number(entry.avgCreativity).toFixed(2)}</TableCell>
                          <TableCell>
                            {entry.needsCommitteeDecision && (
                              <Badge variant="destructive">Perlu keputusan panitia</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {!activeSnapshot && incomplete.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Belum Lengkap Nilai</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1 text-sm">
              {incomplete.map((entry) => (
                <li key={entry.participantId}>
                  {entry.fullName} ({entry.participantNumber}) — dinilai {entry.scoredBy}/
                  {entry.totalJudges} juri
                  {!entry.hasSubmission ? ", belum submit" : ""}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {previousSnapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Penguncian</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {previousSnapshots.map((snapshot) => (
                <li key={snapshot.id} className="border-b pb-2 last:border-0">
                  {snapshot.lockedAt.toLocaleString("id-ID")}
                  {snapshot.reason ? ` — dibuka: ${snapshot.reason}` : ""}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
