"use client"

import { useActionState } from "react"

import { saveScoreAction } from "@/lib/actions/scoring"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const CRITERIA = [
  { key: "theme", label: "Kesesuaian Tema & Kelengkapan Konten (25%)" },
  { key: "design", label: "Desain & UI/UX (25%)" },
  { key: "functionality", label: "Fungsionalitas & Responsive (25%)" },
  { key: "creativity", label: "Kreativitas & Orisinalitas (15%)" },
  { key: "aiUsage", label: "Efektivitas Pakai AI (10%)" },
] as const

type Initial = {
  theme: number
  design: number
  functionality: number
  creativity: number
  aiUsage: number
  notes: string | null
  status: "draft" | "final"
}

export function ScoreForm({
  participantId,
  initial,
  locked,
}: {
  participantId: string
  initial?: Initial
  locked?: boolean
}) {
  const [state, formAction, pending] = useActionState(saveScoreAction, {})

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <input type="hidden" name="participantId" value={participantId} />
      {CRITERIA.map((criterion) => (
        <div key={criterion.key} className="flex flex-col gap-2">
          <Label htmlFor={criterion.key}>{criterion.label}</Label>
          <Input
            id={criterion.key}
            name={criterion.key}
            type="number"
            min={1}
            max={10}
            step={1}
            defaultValue={initial?.[criterion.key] ?? ""}
            disabled={locked}
            required
          />
        </div>
      ))}
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Catatan (opsional)</Label>
        <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} disabled={locked} />
      </div>
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">Tersimpan.</p>}
      {locked && (
        <p className="text-sm text-amber-600">
          Hasil sudah dikunci — nilai tidak dapat diubah sampai kunci dibuka.
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" name="status" value="draft" variant="outline" disabled={pending || locked}>
          Simpan Draft
        </Button>
        <Button type="submit" name="status" value="final" disabled={pending || locked}>
          Simpan Final
        </Button>
      </div>
    </form>
  )
}
