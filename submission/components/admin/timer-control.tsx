"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import {
  closeCompetitionAction,
  pauseCompetitionAction,
  resetCompetitionAction,
  resumeCompetitionAction,
  startCompetitionAction,
} from "@/lib/actions/timer"
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

export function TimerControl({ state }: { state: "not_started" | "running" | "paused" | "closed" }) {
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menjalankan aksi")
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => run(startCompetitionAction)} disabled={pending || state !== "not_started"}>
        Mulai
      </Button>
      <Button
        onClick={() => run(pauseCompetitionAction)}
        disabled={pending || state !== "running"}
        variant="outline"
      >
        Jeda
      </Button>
      <Button
        onClick={() => run(resumeCompetitionAction)}
        disabled={pending || state !== "paused"}
        variant="outline"
      >
        Lanjutkan
      </Button>
      <Button
        onClick={() => run(closeCompetitionAction)}
        disabled={pending || (state !== "running" && state !== "paused")}
        variant="destructive"
      >
        Akhiri
      </Button>
      {state === "closed" && (
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" disabled={pending} />}>
            Mulai Lomba Baru
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mulai lomba baru?</AlertDialogTitle>
              <AlertDialogDescription>
                Status lomba kembali ke &quot;Belum dibuka&quot;. Data peserta, submission, dan
                nilai yang sudah ada tidak terhapus. Pastikan jadwal waktu selesai di Pengaturan
                sudah diperbarui sebelum menekan Mulai lagi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={() => run(resetCompetitionAction)} disabled={pending}>
                {pending ? "Memproses..." : "Ya, Reset"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
