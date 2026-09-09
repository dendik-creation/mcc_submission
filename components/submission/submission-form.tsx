"use client"

import { useActionState } from "react"

import { submitUrlAction } from "@/lib/actions/submissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SubmissionForm({
  defaultUrl,
  disabled,
}: {
  defaultUrl?: string
  disabled?: boolean
}) {
  const [state, formAction, pending] = useActionState(submitUrlAction, {})

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="url">URL Google AI Studio (publik)</Label>
        <Input
          id="url"
          name="url"
          type="url"
          placeholder="https://aistudio.google.com/apps/..."
          defaultValue={defaultUrl}
          disabled={disabled}
          required
        />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="authenticityAck" className="mt-1" disabled={disabled} required />
        <span>Saya menyatakan karya ini asli buatan saya dan tautan sudah publik.</span>
      </label>
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">Tersimpan.</p>}
      <Button type="submit" disabled={disabled || pending}>
        {pending ? "Mengirim..." : defaultUrl ? "Perbarui" : "Submit"}
      </Button>
    </form>
  )
}
