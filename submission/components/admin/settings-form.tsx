"use client"

import { useActionState } from "react"

import { updateCompetitionSettingsAction } from "@/lib/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function toLocalInputValue(date: Date | null) {
  if (!date) return ""
  // ponytail: shift to WIB (UTC+7) then use UTC accessors so this works
  // correctly on a UTC server (VPS) and a UTC Docker image.
  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000)
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${wib.getUTCFullYear()}-${pad(wib.getUTCMonth() + 1)}-${pad(wib.getUTCDate())}T${pad(wib.getUTCHours())}:${pad(wib.getUTCMinutes())}`
}

export function SettingsForm({
  name,
  scheduledStartAt,
  scheduledEndAt,
  timerThresholdSeconds,
}: {
  name: string
  scheduledStartAt: Date | null
  scheduledEndAt: Date | null
  timerThresholdSeconds: number[]
}) {
  const [state, formAction, pending] = useActionState(updateCompetitionSettingsAction, {})

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nama Lomba</Label>
        <Input id="name" name="name" defaultValue={name} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="scheduledStartAt">Waktu Mulai (rencana, informasional)</Label>
        <Input
          id="scheduledStartAt"
          name="scheduledStartAt"
          type="datetime-local"
          defaultValue={toLocalInputValue(scheduledStartAt)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="scheduledEndAt">Waktu Selesai (dipakai tombol Mulai di Overview)</Label>
        <Input
          id="scheduledEndAt"
          name="scheduledEndAt"
          type="datetime-local"
          defaultValue={toLocalInputValue(scheduledEndAt)}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="timerThresholdMinutes">
          Ambang Dialog Proyektor (menit tersisa, pisahkan koma)
        </Label>
        <Input
          id="timerThresholdMinutes"
          name="timerThresholdMinutes"
          defaultValue={timerThresholdSeconds.map((s) => s / 60).join(", ")}
          required
        />
      </div>
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">Tersimpan.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  )
}
