"use client"

import { useEffect, useState } from "react"
import { useActionState } from "react"

import { createParticipantAction } from "@/lib/actions/participants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Browser-safe suggested default — the admin can edit it before submitting.
// Actual account creation always uses lib/csv.ts's generateTempPassword on
// the server (CSV import path) or whatever is typed here.
function suggestPassword() {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz"
  const bytes = new Uint8Array(8)
  window.crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")
}

export function AddParticipantForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [state, formAction, pending] = useActionState(createParticipantAction, {})
  const [password] = useState(suggestPassword)

  useEffect(() => {
    if (state.success) onSuccess?.()
    // Only re-fire when a fresh success comes in, not when the callback identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success])

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="participantNumber">Nomor Peserta</Label>
        <Input id="participantNumber" name="participantNumber" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Nama</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nim">NIM</Label>
        <Input id="nim" name="nim" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact">Kontak</Label>
        <Input id="contact" name="contact" />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" defaultValue={password} required />
      </div>
      {state.error && <p className="text-destructive text-sm sm:col-span-2">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600 sm:col-span-2">Peserta ditambahkan.</p>}
      <Button type="submit" disabled={pending} className="w-fit sm:col-span-2">
        {pending ? "Menyimpan..." : "Tambah Peserta"}
      </Button>
    </form>
  )
}
