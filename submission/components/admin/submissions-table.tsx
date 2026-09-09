"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { FilterXIcon, InboxIcon, UsersIcon } from "lucide-react"

import { SUBMISSION_STATUS_LABEL } from "@/lib/labels"
import {
  ManualRecordDialog,
  ReopenSubmissionDialog,
  SubmissionStatusMenu,
} from "@/components/admin/submission-actions"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type FilterValue = "all" | "not_submitted" | "received" | "received_late" | "needs_fix" | "inaccessible"

type Row = {
  participantId: string
  participantNumber: string
  fullName: string
  submission: {
    id: string
    url: string
    status: "received" | "received_late" | "needs_fix" | "inaccessible"
    submittedAt: string
    reopenedAt: string | null
  } | null
}

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "not_submitted", label: "Belum submit" },
  { value: "received", label: "Diterima" },
  { value: "received_late", label: "Terlambat" },
  { value: "needs_fix", label: "Perlu diperbaiki" },
  { value: "inaccessible", label: "Tidak dapat diakses" },
]

export function SubmissionsTable({ rows }: { rows: Row[] }) {
  const [filter, setFilter] = useState<FilterValue>("all")

  const filtered = useMemo(() => {
    if (filter === "all") return rows
    if (filter === "not_submitted") return rows.filter((row) => !row.submission)
    return rows.filter((row) => row.submission?.status === filter)
  }, [rows, filter])

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Belum ada peserta terdaftar"
        description="Submission peserta akan muncul di sini setelah kamu menambahkan peserta."
        action={
          <Button render={<Link href="/admin/participants" />}>Kelola Peserta</Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterValue)}>
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(({ participantId, participantNumber, fullName, submission }) => (
              <TableRow key={participantId}>
                <TableCell>{participantNumber}</TableCell>
                <TableCell>{fullName}</TableCell>
                <TableCell>
                  {submission ? (
                    <Badge variant={submission.status === "received" ? "default" : "secondary"}>
                      {SUBMISSION_STATUS_LABEL[submission.status]}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Belum submit</Badge>
                  )}
                  {submission?.reopenedAt && (
                    <p className="text-muted-foreground mt-1 text-xs">Dibuka ulang, menunggu update</p>
                  )}
                </TableCell>
                <TableCell className="max-w-64 truncate">
                  {submission ? (
                    <a href={submission.url} target="_blank" rel="noreferrer" className="underline">
                      {submission.url}
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {submission ? new Date(submission.submittedAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {submission ? (
                      <>
                        <SubmissionStatusMenu submissionId={submission.id} current={submission.status} />
                        <ReopenSubmissionDialog participantId={participantId} />
                      </>
                    ) : (
                      <ManualRecordDialog participantId={participantId} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState
                    icon={filter === "all" ? InboxIcon : FilterXIcon}
                    title="Tidak ada peserta pada filter ini"
                    description="Coba pilih filter status yang lain."
                    action={
                      filter !== "all" ? (
                        <Button variant="outline" size="sm" onClick={() => setFilter("all")}>
                          Tampilkan semua
                        </Button>
                      ) : undefined
                    }
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
