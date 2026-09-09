"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"

import { AddParticipantForm } from "@/components/admin/add-participant-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function AddParticipantDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        Tambah Peserta
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Peserta</DialogTitle>
          <DialogDescription>
            Dibuatkan langsung akun login (nomor peserta + password) untuk peserta ini.
          </DialogDescription>
        </DialogHeader>
        <AddParticipantForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
