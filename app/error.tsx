"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div>
        <h1 className="text-lg font-medium">Terjadi kesalahan</h1>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          Halaman gagal dimuat. Sesi kamu mungkin sudah berakhir — coba muat ulang, atau login
          ulang bila masih gagal.
        </p>
        {error.digest && (
          <p className="text-muted-foreground mt-2 font-mono text-xs">Kode: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>Coba Lagi</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  )
}
