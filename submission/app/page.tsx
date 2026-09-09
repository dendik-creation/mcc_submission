import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Vibe Code Competition MCC 2026</h1>
        <p className="text-muted-foreground mt-1 text-sm">Competition Operations Dashboard</p>
      </div>
      <div className="flex gap-3">
        <Button render={<Link href="/login/peserta" />}>Login Peserta</Button>
        <Button render={<Link href="/login/juri" />} variant="outline">
          Login Juri/Admin
        </Button>
      </div>
    </div>
  )
}
