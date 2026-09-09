"use client"

import { useState, useTransition } from "react"

import { importParticipantsCsvAction, type ImportCsvResult } from "@/lib/actions/participants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CsvImport() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ImportCsvResult | null>(null)
  const [file, setFile] = useState<File | null>(null)

  function handleImport() {
    if (!file) return
    const formData = new FormData()
    formData.set("file", file)
    startTransition(async () => {
      const importResult = await importParticipantsCsvAction(formData)
      setResult(importResult)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="csv-file">
        File CSV (kolom: nomor_peserta, nama, nim, kontak, password — kontak &amp; password
        opsional)
      </Label>
      <Input
        id="csv-file"
        type="file"
        accept=".csv,text/csv"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <Button onClick={handleImport} disabled={!file || pending} className="w-fit">
        {pending ? "Mengimpor..." : "Impor CSV"}
      </Button>

      {result && (
        <div className="mt-2 flex flex-col gap-2 text-sm">
          <p>
            {result.imported.length} peserta berhasil diimpor, {result.errors.length} baris gagal.
          </p>
          {result.imported.length > 0 && (
            <div className="max-h-48 overflow-auto rounded border p-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left">
                    <th>Nomor</th>
                    <th>Nama</th>
                    <th>Password</th>
                  </tr>
                </thead>
                <tbody>
                  {result.imported.map((row) => (
                    <tr key={row.participantNumber}>
                      <td>{row.participantNumber}</td>
                      <td>{row.fullName}</td>
                      <td className="font-mono">{row.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-muted-foreground mt-1">
                Catat/salin password sekarang — tidak ditampilkan ulang setelah halaman ini
                ditutup.
              </p>
            </div>
          )}
          {result.errors.length > 0 && (
            <ul className="text-destructive list-disc pl-4">
              {result.errors.map((error, index) => (
                <li key={index}>
                  Baris {error.line}: {error.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
