"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { lockResultsAction, reopenResultsAction } from "@/lib/actions/results"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function LockResultsButton({ disabled }: { disabled?: boolean }) {
  const [pending, startTransition] = useTransition()

  function lock() {
    startTransition(async () => {
      try {
        await lockResultsAction()
        toast.success("Hasil dikunci.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal mengunci hasil")
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button disabled={disabled || pending} />}>
        Kunci Hasil
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kunci Hasil Lomba?</AlertDialogTitle>
          <AlertDialogDescription>
            Peringkat dan tiga pemenang akan disimpan sebagai snapshot resmi. Nilai tidak bisa
            diubah lagi sampai hasil dibuka ulang dengan alasan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={lock} disabled={pending}>
            {pending ? "Mengunci..." : "Ya, Kunci"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function ReopenResultsButton() {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [pending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      try {
        await reopenResultsAction(reason)
        toast.success("Hasil dibuka ulang.")
        setOpen(false)
        setReason("")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal membuka kunci hasil")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>Buka Kunci Hasil</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buka Kunci Hasil</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reopen-results-reason">Alasan</Label>
          <Textarea
            id="reopen-results-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending || !reason.trim()} variant="destructive">
            {pending ? "Membuka..." : "Buka Kunci"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
