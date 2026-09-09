"use client"

import { useMemo, useState } from "react"
import { SearchXIcon, UsersIcon } from "lucide-react"

import { AddParticipantDialog } from "@/components/admin/add-participant-dialog"
import { ParticipantStatusButton } from "@/components/admin/participant-status-button"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Row = {
  id: string
  participantNumber: string
  fullName: string
  nim: string
  contact: string | null
  registrationStatus: "registered" | "disabled"
  hasSubmission: boolean
}

export function ParticipantsTable({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (row) =>
        row.participantNumber.toLowerCase().includes(q) ||
        row.fullName.toLowerCase().includes(q) ||
        row.nim.toLowerCase().includes(q),
    )
  }, [rows, query])

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Belum ada peserta"
        description="Tambahkan peserta satu per satu atau impor lewat CSV untuk mulai."
        action={<AddParticipantDialog />}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Cari nomor peserta, nama, atau NIM..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="max-w-sm"
      />
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>NIM</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submission</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((participant) => (
              <TableRow key={participant.id}>
                <TableCell>{participant.participantNumber}</TableCell>
                <TableCell>{participant.fullName}</TableCell>
                <TableCell>{participant.nim}</TableCell>
                <TableCell>{participant.contact ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={participant.registrationStatus === "registered" ? "default" : "secondary"}>
                    {participant.registrationStatus === "registered" ? "Terdaftar" : "Nonaktif"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {participant.hasSubmission ? (
                    <Badge variant="default">Sudah</Badge>
                  ) : (
                    <Badge variant="secondary">Belum</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <ParticipantStatusButton
                    participantId={participant.id}
                    status={participant.registrationStatus}
                  />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={SearchXIcon}
                    title="Tidak ada peserta yang cocok"
                    description={`Tidak ada hasil untuk "${query}". Coba kata kunci lain.`}
                    className="border-none py-8"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
