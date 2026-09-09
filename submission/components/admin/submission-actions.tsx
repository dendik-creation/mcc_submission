"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  adminRecordSubmissionAction,
  reopenSubmissionAction,
  setSubmissionAccessStatusAction,
} from "@/lib/actions/submissions"
import { SUBMISSION_STATUS_LABEL } from "@/lib/labels"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const STATUS_OPTIONS = ["received", "received_late", "needs_fix", "inaccessible"] as const

export function SubmissionStatusMenu({
  submissionId,
  current,
}: {
  submissionId: string
  current: string
}) {
  const [pending, startTransition] = useTransition()

  function setStatus(status: (typeof STATUS_OPTIONS)[number]) {
    startTransition(async () => {
      try {
        await setSubmissionAccessStatusAction(submissionId, status)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal mengubah status")
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" variant="outline" disabled={pending} />}>
        {SUBMISSION_STATUS_LABEL[current] ?? current}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {STATUS_OPTIONS.map((status) => (
          <DropdownMenuItem key={status} onClick={() => setStatus(status)}>
            {SUBMISSION_STATUS_LABEL[status]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ReopenSubmissionDialog({ participantId }: { participantId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [pending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      try {
        await reopenSubmissionAction(participantId, reason)
        toast.success("Submission dibuka ulang.")
        setOpen(false)
        setReason("")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal membuka ulang")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Buka Ulang</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buka Ulang Submission</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reopen-reason">Alasan</Label>
          <Textarea
            id="reopen-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending || !reason.trim()}>
            {pending ? "Menyimpan..." : "Buka Ulang"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ManualRecordDialog({ participantId }: { participantId: string }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [reason, setReason] = useState("")
  const [wasOnTime, setWasOnTime] = useState(true)
  const [pending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      try {
        await adminRecordSubmissionAction({ participantId, url, reason, wasOnTime })
        toast.success("Submission dicatat manual.")
        setOpen(false)
        setUrl("")
        setReason("")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal mencatat submission")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Catat Manual</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat Submission Manual</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="manual-url">URL</Label>
            <Input
              id="manual-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://aistudio.google.com/apps/..."
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="manual-reason">Alasan (mis. internet peserta bermasalah)</Label>
            <Textarea
              id="manual-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={wasOnTime}
              onChange={(event) => setWasOnTime(event.target.checked)}
            />
            Submission ini sebenarnya tepat waktu
          </label>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending || !url.trim() || !reason.trim()}>
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
