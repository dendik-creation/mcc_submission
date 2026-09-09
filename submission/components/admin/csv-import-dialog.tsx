"use client"

import { useState } from "react"
import { UploadIcon } from "lucide-react"

import { CsvImport } from "@/components/admin/csv-import"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function CsvImportDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <UploadIcon />
        Impor CSV
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Impor Peserta dari CSV</DialogTitle>
          <DialogDescription>
            Kolom: nomor_peserta, nama, nim, kontak, password — kontak dan password opsional.
          </DialogDescription>
        </DialogHeader>
        <CsvImport />
      </DialogContent>
    </Dialog>
  )
}
