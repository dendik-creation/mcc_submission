"use client"

import { useActionState } from "react"

import type { LoginFormState } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type LoginFormProps = {
  action: (state: LoginFormState, formData: FormData) => Promise<LoginFormState>
  identifierLabel: string
  identifierName: string
  identifierType?: string
  submitLabel: string
}

export function LoginForm({
  action,
  identifierLabel,
  identifierName,
  identifierType = "text",
  submitLabel,
}: LoginFormProps) {
  const [state, formAction, pending] = useActionState(action, {})

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={identifierName}>{identifierLabel}</Label>
        <Input
          id={identifierName}
          name={identifierName}
          type={identifierType}
          autoComplete={identifierType === "email" ? "email" : "off"}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Memproses..." : submitLabel}
      </Button>
    </form>
  )
}
