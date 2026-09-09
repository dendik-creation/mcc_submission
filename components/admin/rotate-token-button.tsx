"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { rotateProjectorTokenAction } from "@/lib/actions/settings"
import { Button } from "@/components/ui/button"

export function RotateTokenButton({ currentToken }: { currentToken: string }) {
  const [pending, startTransition] = useTransition()
  const [token, setToken] = useState(currentToken)

  function rotate() {
    startTransition(async () => {
      try {
        const newToken = await rotateProjectorTokenAction()
        setToken(newToken)
        toast.success("Token proyektor diganti. Perbarui layar proyektor dengan URL baru.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal mengganti token")
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm break-all">
        <a href={`/board/${token}`} target="_blank" rel="noreferrer" className="underline">
          /board/{token}
        </a>
      </p>
      <Button variant="outline" size="sm" onClick={rotate} disabled={pending} className="w-fit">
        {pending ? "Mengganti..." : "Ganti Token"}
      </Button>
    </div>
  )
}
